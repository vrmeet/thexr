import {
  filter,
  takeUntil,
  map,
  Observable,
  race,
  take,
  tap,
  Subscription,
} from "rxjs";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs, getPosRot, showNormals } from "../../utils/misc";
import type { AbstractMesh } from "babylonjs";
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

    // this.listenForShootDuringGrab("left");
    // this.listenForShootDuringGrab("right");
  }
  buildBehavior(): IBehavior {
    return new BehaviorHoldable(this);
  }

  //   listenForShootDuringGrab(hand: "left" | "right") {
  //     this.signalHub.movement.on(`${hand}_grip_mesh`).subscribe((mesh) => {
  //       if (this.context.state[mesh.name].grabbable.shootable === "discreet") {
  //         this.signalHub.movement
  //           .on(`${hand}_trigger_squeezed`)
  //           .pipe(takeUntil(this.signalHub.movement.on(`${hand}_lost_mesh`)))
  //           .subscribe((inputSource) => {
  //             this.signalHub.movement.emit("trigger_holding_mesh", {
  //               hand,
  //               mesh,
  //               inputSource,
  //             });
  //
  //             // this.signalHub.movement.emit("");
  //           });
  //       } else if (
  //         this.context.state[mesh.name].grabbable.shootable === "continuous"
  //       ) {
  //         this.signalHub.movement
  //           .on(`${hand}_trigger`)
  //           .pipe(takeUntil(this.signalHub.movement.on(`${hand}_lost_mesh`)))
  //           .subscribe((compChange) => {
  //             this.signalHub.movement.emit("trigger_holding_mesh", {
  //               hand,
  //               mesh,
  //               inputSource: compChange.inputSource,
  //             });

  //             console.log(
  //               "continous spry",
  //               hand,
  //               compChange.inputSource.grip.position.asArray(),
  //               compChange.controllerComponent.value,
  //               compChange.inputSource.pointer.forward.asArray() // direction
  //             );
  //             // this.signalHub.movement.emit("");
  //           });
  //       }
  //     });
  //   }

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
          return this.findGrabbableMesh(inputSource);
        }),
        filter((result) => result !== null)
      )
      .subscribe((data) => {
        // emit that we grabbed a mesh
        this.signalHub.movement.emit(`${hand}_grip_mesh`, {
          mesh: data.mesh,
          input: data.inputSource,
        });
      });
  }

  findGrabbableMesh(inputSource: BABYLON.WebXRInputSource): {
    mesh: BABYLON.AbstractMesh;
    inputSource: BABYLON.WebXRInputSource;
  } | null {
    const multiplier =
      inputSource.motionController.handness[0] === "l" ? 1 : -1;
    const p1 = new BABYLON.Vector3(0.1 * multiplier, 0.1, -0.1);
    const p2 = new BABYLON.Vector3(0, -0.26, 0.024);
    const ray = BABYLON.Ray.CreateNewFromTo(
      p1,
      p2,
      inputSource.grip.getWorldMatrix()
    );
    BABYLON.RayHelper.CreateAndShow(
      ray,
      this.xrs.context.scene,
      BABYLON.Color3.Red()
    );
    const pickInfo = this.context.scene.pickWithRay(ray);

    const entity = this.xrs.context.entities[pickInfo.pickedMesh?.name];
    if (entity && entity.hasComponent("holdable")) {
      return {
        mesh: pickInfo.pickedMesh,
        inputSource,
      };
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
  }

  // side effect of receiving a mesh grabbed messaged
  parentGrabbedMeshIntoHand(hand: "left" | "right") {
    //TODO, move all this logic into the transform system,
    // idea: can call a function from the transform system if we want it to be fast
    if (this.grabbedMesh.physicsImpostor) {
      this.grabbedMesh.physicsImpostor.dispose();
      this.grabbedMesh.physicsImpostor = null;
    }

    if (this.grabbedMesh.parent) {
      // if grabbed by other hand, unparent so we get world position
      this.grabbedMesh.setParent(null);
    }
    const handNode = this.system[`${hand}HandNode`];
    if (!this.data.offset) {
      // you can pick this object up anywhere
      this.grabbedMesh.setParent(handNode); // retains grabbedMesh position in world space
    } else if (this.data.offset) {
      this.grabbedMesh.position = BABYLON.Vector3.FromArray(
        this.data.offset.pos
      );
      this.grabbedMesh.rotation = BABYLON.Vector3.FromArray(
        this.data.offset.rot
      );
      this.grabbedMesh.parent = handNode;
    }

    // emit external event
    const transform = {
      position: arrayReduceSigFigs(this.grabbedMesh.position.asArray()),
      rotation: arrayReduceSigFigs(this.grabbedMesh.rotation.asArray()),
      parent: handNode.name,
    };

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
          this.releaseEvents(hand, event.mesh).pipe(take(1)).subscribe();
        })
    );
  }

  releaseEvents(hand: "left" | "right", grabbedMesh: BABYLON.AbstractMesh) {
    const otherHand = hand[0] === "l" ? "right" : "left";
    return race(
      // if other hand grabbed the same mesh away from the first hand
      this.context.signalHub.movement.on(`${otherHand}_grip_mesh`).pipe(
        filter((data) => data.mesh.name === grabbedMesh.name),
        tap(() => {
          this.signalHub.movement.emit(`${hand}_lost_mesh`, {
            reason: "transferred",
            mesh: this.grabbedMesh,
            input: null,
          });
        })
      ),
      // OR another player stole our object
      this.context.signalHub.incoming.on("components_upserted").pipe(
        filter(
          (msg) =>
            msg.id === grabbedMesh.name &&
            msg.components?.grabbable?.grabbed_by !== this.context.my_member_id
        ),
        tap((msg) => {
          this.signalHub.movement.emit(`${hand}_lost_mesh`, {
            reason: "taken",
            mesh: this.grabbedMesh,
            input: null,
          });
        })
      ),

      // OR the hand released the mesh
      this.context.signalHub.movement.on(`${hand}_grip_released`).pipe(
        tap((inputSource) => {
          this.releaseMesh(hand, inputSource);
          this.signalHub.movement.emit(`${hand}_lost_mesh`, {
            reason: "released",
            mesh: this.grabbedMesh,
            input: inputSource,
          });
        })
      )
    );
  }
  releaseMesh(hand: "left" | "right", inputSource: BABYLON.WebXRInputSource) {
    this.grabbedMesh.setParent(null);
    this.signalHub.outgoing.emit("components_upserted", {
      id: this.entity.name,
      components: {
        transform: {
          position: arrayReduceSigFigs(this.grabbedMesh.position.asArray()),
          rotation: arrayReduceSigFigs(this.grabbedMesh.rotation.asArray()),
          parent: null,
        },
      },
    });
    this.grabbedMesh = null;
  }
}
