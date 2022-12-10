import {
  filter,
  map,
  Observable,
  race,
  take,
  Subscription,
  mapTo,
  tap,
} from "rxjs";
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
          return this.findGrabbableMesh(inputSource);
        }),
        filter((result) => result !== null)
      )
      .subscribe((data) => {
        // emit that we grabbed a mesh
        this.signalHub.movement.emit(`${hand}_grip_mesh`, {
          mesh: data.mesh,
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
            .subscribe((releaseEvent) => {
              this.signalHub.movement.emit(`${hand}_lost_mesh`, {
                reason: releaseEvent.reason as any,
                mesh: event.mesh,
              });
              if (releaseEvent.reason === "released") {
                console.log(
                  "during a release the input source was",
                  releaseEvent.inputSource
                );
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
        mapTo({ reason: "transferred", inputSource: null })
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
        mapTo({ reason: "taken", inputSource: null })
      ),

      // OR the hand released the mesh
      this.context.signalHub.movement.on(`${hand}_grip_released`).pipe(
        tap((evt) => {
          console.log("tap on grip released", evt.inputSource);
        }),
        map((evt) => ({ reason: "released", inputSource: evt.inputSource }))
      )
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
