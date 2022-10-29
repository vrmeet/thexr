import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";
import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import { filter, switchMap, takeUntil } from "rxjs";
import { arrayReduceSigFigs } from "../../utils/misc";

/*
a particular implementation of a gun
*/

type FireBulletEvent = {
  name: "fire_bullet";
  shooter: string;
  gun: string;
  pos: number[];
  direction: number[];
};
const BULLET_SIZE = 1;
const BULLET_SPEED = 60;
const BULLET_DISTANCE = 60;
const FRAME_RATE = 60;

export class SystemGun implements ISystem {
  public name = "gun";
  public order = 30;
  public context: Context;
  public signalHub: SignalHub;
  public bulletModel: BABYLON.AbstractMesh;
  public bulletTrail: BABYLON.IParticleSystem;
  public scene: BABYLON.Scene;
  public ray: BABYLON.Ray;
  public rayHelper: BABYLON.RayHelper;
  async init(context: Context) {
    this.context = context;
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.ray = new BABYLON.Ray(
      BABYLON.Vector3.Zero(),
      BABYLON.Vector3.One(),
      1
    );
    this.rayHelper = new BABYLON.RayHelper(this.ray);

    this.bulletModel = BABYLON.MeshBuilder.CreateCapsule(
      "bullet",
      {
        height: BULLET_SIZE * 0.1,
        radiusTop: BULLET_SIZE * 0.03,
        radiusBottom: BULLET_SIZE * 0.05,
      },
      this.context.scene
    );
    this.bulletModel.setEnabled(false);

    this.bulletTrail = await BABYLON.ParticleHelper.CreateFromSnippetAsync(
      "HYB2FR#51",
      this.scene,
      false,
      "https://www.babylonjs-playground.com/"
    );
    this.bulletTrail.stop();

    this.signalHub.movement
      .on("trigger_holding_mesh")
      .pipe(
        filter(
          (evt) =>
            this.context.state[evt.mesh.name] !== undefined &&
            this.context.state[evt.mesh.name].gun !== undefined
        )
      )
      .subscribe((evt) => {
        // fire a bullet if we have ammo
        console.log("fire a bullet");
        this.signalHub.outgoing.emit("msg", {
          system: "gun",
          data: <FireBulletEvent>{
            name: "fire_bullet",
            shooter: this.context.my_member_id,
            gun: evt.mesh.name,
            pos: arrayReduceSigFigs(
              evt.inputSource.grip.absolutePosition.asArray()
            ),
            direction: arrayReduceSigFigs(
              evt.inputSource.pointer.forward.asArray()
            ),
          },
        });
      });

    // replenish ammo if I pick up a collectable...

    // animate (destroy a target if MY bullet hits it)

    // animate a bullet when given that message
  }

  // this method called on custom msg that matches system name
  process_msg(data: FireBulletEvent) {
    console.log("a bulelt was fired", data);
    const bullet = this.bulletModel.clone("bullet", null);
    bullet.setEnabled(true);
    bullet.position.fromArray(data.pos);
    const target = bullet.position.add(
      BABYLON.Vector3.FromArray(data.direction).scale(BULLET_DISTANCE)
    );
    bullet.lookAt(target, null, BABYLON.Angle.FromDegrees(90).radians());
    const particleSystem = this.bulletTrail.clone("", bullet);
    particleSystem.start();

    const removeBullet = () => {
      particleSystem.stop();
      bullet.visibility = 0;
      setTimeout(() => {
        particleSystem.dispose();
        bullet.dispose();
      }, 2000);
    };

    const animation = BABYLON.Animation.CreateAndStartAnimation(
      "animate_bullet",
      bullet,
      "position",
      FRAME_RATE,
      (FRAME_RATE * BULLET_DISTANCE) / BULLET_SPEED,
      bullet.position,
      target,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      () => {
        removeBullet();
        this.scene.unregisterBeforeRender(checkBulletForIntersect);
      }
    );

    const checkBulletForIntersect = () => {
      this.ray.origin.copyFrom(bullet.position);
      this.ray.direction.fromArray(data.direction);
      this.ray.origin.addInPlace(this.ray.direction.scale(BULLET_SIZE * 0.1));
      // the faster the bullet the longer the beam needs to be
      this.ray.length = (2 * BULLET_SPEED) / BULLET_DISTANCE;

      const hitTest = this.scene.pickWithRay(this.ray);
      if (hitTest.pickedMesh) {
        this.scene.unregisterAfterRender(checkBulletForIntersect);
        animation.stop();

        // TODO, after hit something, emit some message,
        console.log("a bullet hit something");
        removeBullet();
      }
    };

    //see if this bullet intersects *any* mesh
    this.scene.registerBeforeRender(checkBulletForIntersect);
  }
}
