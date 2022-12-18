import { filter, map, Observable, race, take, Subscription, mapTo } from "rxjs";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs, getSetParentValues } from "../../utils/misc";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { Context } from "../context";
import type { SystemXR } from "./xr";
import type { SignalHub } from "../../signalHub";
import type { XRS } from "../xrs";
import type { Entity } from "../entity";

/**
 * receives the lower level messages coming from system xr and determines if
 * a mesh was gripped, emitting higher level messages
 */
export class SystemHoldable extends BaseSystemWithBehaviors implements ISystem {
  public context: Context;
  public name = "holdable";
  public order = 20;
  public exitingXR$: Observable<BABYLON.WebXRState>;
  public leftHandNode: BABYLON.Node;
  public rightHandNode: BABYLON.Node;
  // retain some memory of what we're holding here in case controller blip off we can reattach to our grip
  public leftHeldObject: BABYLON.Node;
  public rightHeldObject: BABYLON.Node;
  public systemXR: SystemXR;
  public signalHub: SignalHub;
  public xrs: XRS;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.signalHub = xrs.context.signalHub;
    this.systemXR = xrs.context.systems["xr"] as SystemXR;

    this.exitingXR$ = this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    // avatars always have hands, so when entering XR, have them track with the controllers
    this.parentAvatarHandsToGripWheneverControllersAreOnline();

    this.detectMeshGrab("left");
    this.detectMeshGrab("right");
  }
  buildBehavior(): IBehavior {
    return new BehaviorHoldable(this);
  }

  parentAvatarHandsToGripWheneverControllersAreOnline() {
    this.context.signalHub.local
      .on("controller_ready")
      .subscribe(({ hand, grip }) => {
        const nodeName = `${this.context.my_member_id}_avatar_${hand}_transform`;
        const node = this.context.scene.getTransformNodeByName(nodeName);

        // return everything the way it was after we're done
        const prevParent = node.parent;
        const prevPosition = node.position.clone();
        const prevRotation = node.rotationQuaternion.clone();

        this.exitingXR$.subscribe(() => {
          node.parent = null;
          node.position = prevPosition;
          node.rotationQuaternion = prevRotation;
          node.parent = prevParent;
        });
        node.position = BABYLON.Vector3.Zero();
        node.rotationQuaternion = new BABYLON.Quaternion();
        node.parent = null;

        node.parent = grip;
        this[`${hand}HandNode`] = node;
        // on a blip, if we were grabbing something, put it in the hand
        const grabbedObject = this[`${hand}HeldObject`];
        if (grabbedObject) {
          grabbedObject.parent = node;
        }
      });
  }

  detectMeshGrab(hand: "left" | "right") {
    this.context.signalHub.movement
      .on(`${hand}_grip_squeezed`)
      .pipe(
        map((inputSource) => {
          return this.findGrabbableMesh(
            hand,
            inputSource.grip.getWorldMatrix()
          );
        }),
        filter((result) => result !== null)
      )
      .subscribe((foundMesh) => {
        // emit that we grabbed a mesh
        this.signalHub.movement.emit(`${hand}_grip_mesh`, {
          mesh: foundMesh,
        });
      });
  }

  findGrabbableMesh(
    hand: "left" | "right",
    handMatrix: BABYLON.Matrix
  ): BABYLON.AbstractMesh | null {
    const multiplier = hand[0] === "l" ? 1 : -1;

    const rayParams = [
      { p1: [multiplier * 0.03, 0, 0], p2: [multiplier * 0.2, 0, 0] }, // horizontal
      { p1: [0, -0.05, 0], p2: [0, -0.2, 0] }, // forward,
      { p1: [0, 0, 0.05], p2: [0, 0, 0.1] }, // top
      {
        p1: [multiplier * 0.08, 0, 0.05],
        p2: [multiplier * 0.08, -0.2, 0.05],
      }, // 2nd forward,

      // { p1: [0.1 * multiplier, 0.1, -0.1], p2: [0, -0.26, 0.024] }, // diagonal
    ];

    for (let i = 0; i < rayParams.length; i++) {
      const { p1, p2 } = rayParams[i];
      const ray = BABYLON.Ray.CreateNewFromTo(
        BABYLON.Vector3.FromArray(p1),
        BABYLON.Vector3.FromArray(p2),
        handMatrix
      );
      // BABYLON.RayHelper.CreateAndShow(
      //   ray,
      //   this.xrs.context.scene,
      //   BABYLON.Color3.Red()
      // );

      const pickInfo = this.context.scene.pickWithRay(ray);
      const entity = this.xrs.context.entities[pickInfo.pickedMesh?.name];
      if (entity && entity.hasComponent("holdable")) {
        return pickInfo.pickedMesh;
      }
    }
    return null;
  }
}

type HoldableType = {
  offset?: { pos: number[]; rot: number[] };
};

export class BehaviorHoldable implements IBehavior {
  data: HoldableType;
  entity: Entity;
  subscriptions: Subscription[] = [];
  signalHub: SignalHub;
  context: Context;
  grabbedMesh: BABYLON.AbstractMesh;
  constructor(public system: SystemHoldable) {
    this.context = this.system.context;
    this.signalHub = this.system.context.signalHub;
  }
  add(entity: Entity, data: HoldableType): void {
    this.entity = entity;
    this.data = data;
    // listen for a grab message matching this entity

    this.addSubscription("left");
    this.addSubscription("right");
  }
  update(data: HoldableType): void {
    Object.assign(this.data, data);
  }
  remove(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.length = 0;
  }

  // side effect of receiving a mesh grabbed messaged
  parentGrabbedMeshIntoHand(hand: "left" | "right") {
    const handNode = this.system[`${hand}HandNode`];

    let transform = {};
    if (this.data.offset) {
      transform = {
        position: this.data.offset.pos,
        rotation: this.data.offset.rot,
        parent: handNode.name,
      };
    } else {
      const { pos, rot } = getSetParentValues(this.grabbedMesh, handNode);
      transform = {
        position: arrayReduceSigFigs(pos),
        rotation: arrayReduceSigFigs(rot),
        parent: handNode.name,
      };
    }

    // tell everyone (and ourselves) you grabbed it
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: this.grabbedMesh.name,
      components: {
        transform: transform,
      },
    });
  }

  addSubscription(hand: "left" | "right") {
    this.subscriptions.push(
      this.signalHub.movement
        .on(`${hand}_grip_mesh`)
        .pipe(filter((evt) => evt.mesh.name === this.entity.name))
        .subscribe((event) => {
          this.grabbedMesh = event.mesh;
          this.parentGrabbedMeshIntoHand(hand);
          this.releaseEvents(hand, event.mesh)
            .pipe(take(1))
            .subscribe((reason) => {
              this.signalHub.movement.emit(`${hand}_lost_mesh`, {
                reason,
                mesh: event.mesh,
              });
              if (reason === "released") {
                this.releaseMesh();
              }
            });
        })
    );
  }

  releaseEvents(hand: "left" | "right", grabbedMesh: BABYLON.AbstractMesh) {
    const otherHand = hand[0] === "l" ? "right" : "left";
    return race(
      // if other hand grabbed the same mesh away from the first hand
      this.context.signalHub.movement.on(`${otherHand}_grip_mesh`).pipe(
        filter((data) => data.mesh.name === grabbedMesh.name),
        map(() => "transferred")
      ),
      // OR another player stole our object
      this.context.signalHub.incoming.on("components_upserted").pipe(
        filter(
          (msg) =>
            msg.id === grabbedMesh.name &&
            msg.components?.transform?.parent !== null &&
            !msg.components?.transform?.parent.includes(
              this.context.my_member_id
            )
        ),
        map(() => "taken")
      ),

      // OR the hand released the mesh
      this.context.signalHub.movement
        .on(`${hand}_grip_released`)
        .pipe(map(() => "released"))
    );
  }
  releaseMesh() {
    // this.grabbedMesh.setParent(null);
    const payload = {
      id: this.entity.name,
      components: {
        transform: {
          position: arrayReduceSigFigs(
            this.grabbedMesh.absolutePosition.asArray()
          ),
          rotation: arrayReduceSigFigs(
            this.grabbedMesh.absoluteRotationQuaternion.asArray()
          ),
          parent: null,
        },
      },
    };
    // this.signalHub.outgoing.emit("msg", {
    //   system: "hud",
    //   data: { msg: JSON.stringify(payload) },
    // });
    this.signalHub.outgoing.emit("components_upserted", payload);
    this.grabbedMesh = null;
  }
}
