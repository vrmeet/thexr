import * as BABYLON from "babylonjs";
import { filter, Subscription } from "rxjs";
import type { SignalHub } from "../../signalHub";
import { arrayReduceSigFigs } from "../../utils/misc";
import type { Context } from "../context";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { XRS } from "../xrs";
import type { SystemXR } from "./xr";

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

export class SystemGun extends BaseSystemWithBehaviors implements ISystem {
  public name = "gun";
  public order = 40;
  public context: Context;
  public signalHub: SignalHub;
  public bulletModel: BABYLON.AbstractMesh;
  public bulletTrail: BABYLON.IParticleSystem;
  public scene: BABYLON.Scene;
  public ray: BABYLON.Ray;
  public rayHelper: BABYLON.RayHelper;
  public xrs: XRS;
  public systemXR: SystemXR;
  async setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = this.xrs.context;
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.systemXR = this.xrs.getSystem("xr") as SystemXR;
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

    // this.signalHub.movement
    //   .on("trigger_holding_mesh")
    //   .pipe(
    //     filter(
    //       (evt) =>
    //         this.context.state[evt.mesh.name] !== undefined &&
    //         this.context.state[evt.mesh.name].gun !== undefined
    //     )
    //   )
    //   .subscribe((evt) => {
    //     // fire a bullet if we have ammo
    //
    //     this.signalHub.outgoing.emit("msg", {
    //       system: "gun",
    //       data: <FireBulletEvent>{
    //         name: "fire_bullet",
    //         shooter: this.context.my_member_id,
    //         gun: evt.mesh.name,
    //         pos: arrayReduceSigFigs(
    //           evt.inputSource.grip.absolutePosition.asArray()
    //         ),
    //         direction: arrayReduceSigFigs(
    //           evt.inputSource.pointer.forward.asArray()
    //         ),
    //       },
    //     });
    //   });

    // replenish ammo if I pick up a collectable...

    // animate (destroy a target if MY bullet hits it)

    // animate a bullet when given that message
  }

  // this method called on custom msg that matches system name
  processMsg(data: FireBulletEvent) {
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

        removeBullet();
      }
    };

    //see if this bullet intersects *any* mesh
    this.scene.registerBeforeRender(checkBulletForIntersect);
  }
  buildBehavior(): IBehavior {
    return new BehaviorGun(this);
  }
}

export class BehaviorGun implements IBehavior {
  data: any;
  entity: Entity;
  subscription: Subscription;
  signalHub: SignalHub;
  constructor(public system: SystemGun) {
    this.signalHub = this.system.context.signalHub;
  }
  add(entity: Entity, data: any): void {
    this.entity = entity;
    this.data = data;
    this.subscription = this.makeSubscription();
  }
  update(data: any): void {
    this.data = data;
  }
  remove(): void {
    this.subscription.unsubscribe();
  }
  makeSubscription() {
    return this.signalHub.movement
      .on("trigger_holding_mesh")
      .pipe(filter((evt) => evt.mesh.name === this.entity.name))
      .subscribe((evt) => {
        this.emitBulletFire(evt.hand);
      });
  }
  emitBulletFire(hand: "left" | "right") {
    // fire a bullet if we have ammo
    const inputSource = this.system.systemXR.getInputSource(hand);

    return this.signalHub.outgoing.emit("msg", {
      system: "gun",
      data: <FireBulletEvent>{
        name: "fire_bullet",
        shooter: this.system.context.my_member_id,
        gun: this.entity.name,
        pos: arrayReduceSigFigs(inputSource.grip.absolutePosition.asArray()),
        direction: arrayReduceSigFigs(inputSource.pointer.forward.asArray()),
      },
    });
  }
}
