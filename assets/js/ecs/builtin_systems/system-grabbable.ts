import { filter, takeUntil, map, Observable, race, take, tap } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs } from "../../utils/misc";
import type { AbstractMesh } from "babylonjs";

export class SystemGrabbable implements ISystem {
  public context: Context;
  public name = "grabbable";
  public order = 20;
  public exitingXR$: Observable<BABYLON.WebXRState>;
  public leftHandNode: BABYLON.AbstractMesh;
  public rightHandNode: BABYLON.AbstractMesh;
  init(context: Context) {
    this.context = context;

    this.exitingXR$ = this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    this.parentAvatarHandsToGrip();

    this.listenForGrab("left");
    this.listenForGrab("right");
  }

  parentAvatarHandsToGrip() {
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
        // node.showBoundingBox = true;
        // node.visibility = 0.8;

        // set in relative space of the grip
        // node.position =
        //   hand[0] === "l"
        //     ? new BABYLON.Vector3(0.03, -0.05, 0.0)
        //     : new BABYLON.Vector3(-0.03, -0.05, 0.0);
        // node.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
        //   BABYLON.Angle.FromDegrees(45).radians(),
        //   0,
        //   0
        // );
        node.parent = grip;
        this[`${hand}HandNode`] = node;
      });
  }

  listenForGrab(hand: "left" | "right") {
    this.context.signalHub.movement
      .on(`${hand}_grip_squeezed`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((inputSource) => {
          return this.findGrabbableMesh(inputSource);
        }),
        filter((result) => result !== null)
      )
      .subscribe((data) => {
        if (data.grabbableComponent.pickup !== undefined) {
          this.parentGrabbedMeshIntoHand(
            hand,
            data.mesh,
            data.grabbableComponent
          );

          this.listenForReleaseEvents(hand, data.mesh);
        }
      });
  }

  listenForReleaseEvents(
    hand: "left" | "right",
    grabbedMesh: BABYLON.AbstractMesh
  ) {
    const otherHand = hand[0] === "l" ? "right" : "left";
    race(
      // if other hand grabbed the same mesh away from the first hand
      this.context.signalHub.movement.on(`${otherHand}_grip_mesh`).pipe(
        filter((mesh) => mesh.name === grabbedMesh.name),
        tap(() => {
          console.log("other hand grabbed mesh away");
        })
      ),
      // OR another player stole our object
      this.context.signalHub.incoming.on("components_upserted").pipe(
        filter(
          (msg) =>
            msg.id === grabbedMesh.name &&
            msg.components?.grabbable?.grabbed_by !== this.context.my_member_id
        ),
        tap(() => {
          console.log("other player stole mesh away");
        })
      ),

      // OR the hand released the mesh
      this.context.signalHub.movement.on(`${hand}_grip_released`).pipe(
        tap(() => {
          console.log("hand released mesh");
          grabbedMesh.setParent(null); // keeps current position in world space
          this.context.signalHub.outgoing.emit("components_upserted", {
            id: grabbedMesh.name,
            components: {
              grabbable: { grabbed_by: null },
              transform: {
                parent: null,
                position: arrayReduceSigFigs(grabbedMesh.position.asArray()),
                rotation: arrayReduceSigFigs(grabbedMesh.rotation.asArray()),
              },
            },
          });
        })
      )
    )
      .pipe(take(1))
      .subscribe();
  }

  parentGrabbedMeshIntoHand(
    hand: "left" | "right",
    grabbedMesh: BABYLON.AbstractMesh,
    grabbableComponent: ComponentObj["grabbable"]
  ) {
    if (grabbedMesh.parent) {
      // if grabbed by other hand, unparent so we get world position
      grabbedMesh.setParent(null);
    }
    const handNode = this[`${hand}HandNode`];
    if (grabbableComponent.pickup === "any") {
      // you can pick this object up anywhere
      grabbedMesh.setParent(handNode); // retains grabbedMesh position in world space
    } else if (grabbableComponent.pickup === "fixed") {
      grabbedMesh.position = BABYLON.Vector3.Zero();
      grabbedMesh.rotation = BABYLON.Vector3.Zero();
      grabbedMesh.parent = handNode;
    }

    const transform = {
      position: arrayReduceSigFigs(grabbedMesh.position.asArray()),
      rotation: arrayReduceSigFigs(grabbedMesh.rotation.asArray()),
      parent: handNode.name,
    };
    console.log("parented mesh", grabbedMesh.name, "to", handNode.name);
    // update your own state, this helps dup delayed incoming event from repeating
    Object.assign(this.context.state[grabbedMesh.name].transform, transform);

    // make grip mesh event
    this.context.signalHub.movement.emit(`${hand}_grip_mesh`, grabbedMesh);

    // tell everyone you grabbed it
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: grabbedMesh.name,
      components: {
        grabbable: { grabbed_by: this.context.my_member_id },
        transform: transform,
      },
    });
  }

  findGrabbableMesh(inputSource: BABYLON.WebXRInputSource): {
    mesh: BABYLON.AbstractMesh;
    grabbableComponent: ComponentObj["grabbable"];
    inputSource: BABYLON.WebXRInputSource;
  } | null {
    // ray points right on left grip, points left on right grip
    // const offset = inputSource.motionController.handness[0] === "l" ? 1 : -1;
    // const localDirection = new BABYLON.Vector3(offset, 0, 0);
    // const gripWorldMatrix = inputSource.grip.getWorldMatrix();
    // // transform local vector into world space, however the grip is orientated
    // const worldDirection = BABYLON.Vector3.TransformNormal(
    //   localDirection,
    //   gripWorldMatrix
    // );

    // const origin = inputSource.grip.position.clone();
    // const ray = new BABYLON.Ray(origin, worldDirection, 0.25);
    const multiplier =
      inputSource.motionController.handness[0] === "l" ? 1 : -1;
    const p1 = new BABYLON.Vector3(0.1 * multiplier, 0.05, -0.05);
    const p2 = new BABYLON.Vector3(0, -0.2, 0.1);
    const ray = BABYLON.Ray.CreateNewFromTo(
      p1,
      p2,
      inputSource.grip.getWorldMatrix()
    );
    // const rayHelper = new BABYLON.RayHelper(ray);
    // rayHelper.show(this.context.scene, BABYLON.Color3.Red());
    const pickInfo = this.context.scene.pickWithRay(ray);
    if (
      pickInfo.pickedMesh &&
      this.context.state[pickInfo.pickedMesh.name] !== undefined &&
      this.context.state[pickInfo.pickedMesh.name].grabbable !== undefined
    ) {
      console.log(
        inputSource.motionController.handness,
        "found",
        pickInfo.pickedMesh.name,
        "to grab"
      );
      return {
        mesh: pickInfo.pickedMesh,
        grabbableComponent:
          this.context.state[pickInfo.pickedMesh.name].grabbable,
        inputSource,
      };
    }
    console.log("no grab");
    return null;
  }
}
