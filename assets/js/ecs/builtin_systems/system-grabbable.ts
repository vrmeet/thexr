import { filter, takeUntil, map, Observable } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs } from "../../utils/misc";

export class SystemGrabbable implements ISystem {
  public context: Context;
  public name = "grabbable";
  public order = 20;
  public exitingXR$: Observable<BABYLON.WebXRState>;
  public leftPalmMesh: BABYLON.AbstractMesh;
  public rightPalmMesh: BABYLON.AbstractMesh;
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
        const meshName = `avatar_${this.context.my_member_id}_${hand}`;
        const mesh = this.context.scene.getMeshByName(meshName);

        // return everything the way it was after we're done
        const prevParent = mesh.parent;
        const prevPosition = mesh.position.clone();
        const prevRotation = mesh.rotationQuaternion.clone();

        this.exitingXR$.subscribe(() => {
          mesh.parent = null;
          mesh.position = prevPosition;
          mesh.rotationQuaternion = prevRotation;
          mesh.parent = prevParent;
        });

        mesh.parent = null;
        mesh.showBoundingBox = true;
        mesh.visibility = 0.8;

        // set in relative space of the grip
        mesh.position =
          hand[0] === "l"
            ? new BABYLON.Vector3(0.03, -0.05, 0.0)
            : new BABYLON.Vector3(-0.03, -0.05, 0.0);
        mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          BABYLON.Angle.FromDegrees(45).radians(),
          0,
          0
        );
        mesh.parent = grip;
        this[`${hand}PalmMesh`] = mesh;
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
            this[`${hand}PalmMesh`],
            data.mesh,
            data.grabbableComponent
          );
        }
        // this.context.signalHub.movement.emit(`${hand}_grip_mesh`, data.mesh);
      });
  }

  parentGrabbedMeshIntoHand(
    handMesh: BABYLON.AbstractMesh,
    grabbedMesh: BABYLON.AbstractMesh,
    grabbableComponent: ComponentObj["grabbable"]
  ) {
    if (grabbableComponent.pickup === "any") {
      // you can pick this object up anywhere
      grabbedMesh.setParent(handMesh); // retains grabbedMesh position in world space
    } else if (grabbableComponent.pickup === "fixed") {
      grabbedMesh.parent = handMesh;
    }
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: grabbedMesh.name,
      components: {
        grabbable: { grabbed_by: this.context.my_member_id },
        transform: {
          position: arrayReduceSigFigs(grabbedMesh.position.asArray()),
          rotation: arrayReduceSigFigs(grabbedMesh.rotation.asArray()),
          parent: handMesh.name,
        },
      },
    });
  }

  findGrabbableMesh(inputSource: BABYLON.WebXRInputSource): {
    mesh: BABYLON.AbstractMesh;
    grabbableComponent: ComponentObj["grabbable"];
    inputSource: BABYLON.WebXRInputSource;
  } | null {
    // ray points right on left grip, points left on right grip
    const offset = inputSource.motionController.handness[0] === "l" ? 1 : -1;
    const localDirection = new BABYLON.Vector3(offset, 0, 0);
    const gripWorldMatrix = inputSource.grip.getWorldMatrix();
    // transform local vector into world space, however the grip is orientated
    const worldDirection = BABYLON.Vector3.TransformNormal(
      localDirection,
      gripWorldMatrix
    );

    const origin = inputSource.grip.position.clone();
    const ray = new BABYLON.Ray(origin, worldDirection, 0.25);

    const rayHelper = new BABYLON.RayHelper(ray);
    rayHelper.show(this.context.scene, BABYLON.Color3.Red());
    const pickInfo = this.context.scene.pickWithRay(ray);
    if (
      pickInfo.pickedMesh &&
      this.context.state[pickInfo.pickedMesh.name] !== undefined &&
      this.context.state[pickInfo.pickedMesh.name].grabbable !== undefined
    ) {
      return {
        mesh: pickInfo.pickedMesh,
        grabbableComponent:
          this.context.state[pickInfo.pickedMesh.name].grabbable,
        inputSource,
      };
    }
    return null;
  }
}
