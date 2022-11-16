import { filter, takeUntil, map, Observable, race, take, tap } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs, getPosRot, showNormals } from "../../utils/misc";
import type { AbstractMesh } from "babylonjs";
import type { SystemXR } from "./system-xr";
import type { SignalHub } from "../../signalHub";

export class SystemGrabbable implements ISystem {
  public context: Context;
  public name = "grabbable";
  public order = 20;
  public exitingXR$: Observable<BABYLON.WebXRState>;
  public leftHandNode: BABYLON.Node;
  public rightHandNode: BABYLON.Node;
  // retain some memory of what we're holding here in case controller blip off we can reattach to our grip
  public leftGrabbedObject: BABYLON.Node;
  public rightGrabbedObject: BABYLON.Node;
  public systemXR: SystemXR;
  public signalHub: SignalHub;

  init(context: Context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.systemXR = context.systems["xr"] as SystemXR;

    this.exitingXR$ = this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    this.parentAvatarHandsToGrip();

    this.listenForGrab("left");
    this.listenForGrab("right");

    this.listenForShootDuringGrab("left");
    this.listenForShootDuringGrab("right");
  }

  listenForShootDuringGrab(hand: "left" | "right") {
    this.signalHub.movement.on(`${hand}_grip_mesh`).subscribe((mesh) => {
      if (this.context.state[mesh.name].grabbable.shootable === "discreet") {
        this.signalHub.movement
          .on(`${hand}_trigger_squeezed`)
          .pipe(takeUntil(this.signalHub.movement.on(`${hand}_lost_mesh`)))
          .subscribe((inputSource) => {
            this.signalHub.movement.emit("trigger_holding_mesh", {
              hand,
              mesh,
              inputSource,
            });
            console.log("discreet gun fire");
            // this.signalHub.movement.emit("");
          });
      } else if (
        this.context.state[mesh.name].grabbable.shootable === "continuous"
      ) {
        this.signalHub.movement
          .on(`${hand}_trigger`)
          .pipe(takeUntil(this.signalHub.movement.on(`${hand}_lost_mesh`)))
          .subscribe((compChange) => {
            this.signalHub.movement.emit("trigger_holding_mesh", {
              hand,
              mesh,
              inputSource: compChange.inputSource,
            });

            console.log(
              "continous spry",
              hand,
              compChange.inputSource.grip.position.asArray(),
              compChange.controllerComponent.value,
              compChange.inputSource.pointer.forward.asArray() // direction
            );
            // this.signalHub.movement.emit("");
          });
      }
    });
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
        const grabbedObject = this[`${hand}GrabbedObject`];
        if (grabbedObject) {
          grabbedObject.parent = node;
        }
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
        tap((msg) => {
          console.log("other player stole mesh away", msg.components.grabbable);
        })
      ),

      // OR the hand released the mesh
      this.context.signalHub.movement.on(`${hand}_grip_released`).pipe(
        tap((inputSource) => {
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
          // if this grabble component supports throwable, then send custom message
          // to impulse it and determine it's final resting position with another pos rotation update msg
          if (this.context.state[grabbedMesh.name].grabbable?.throwable) {
            console.log("this is throwable");
            //tell everyone to send it flying
            const imposter =
              this.systemXR.controllerPhysicsFeature.getImpostorForController(
                inputSource
              );
            const lv = arrayReduceSigFigs(
              imposter.getLinearVelocity().asArray()
            );
            const av = arrayReduceSigFigs(
              imposter.getAngularVelocity().asArray()
            );

            this.context.signalHub.outgoing.emit("msg", {
              system: "grabbable",
              data: {
                throw: grabbedMesh.name,
                av,
                lv,
                pos: arrayReduceSigFigs(
                  grabbedMesh.getAbsolutePosition().asArray()
                ),
                rot: arrayReduceSigFigs(grabbedMesh.rotation.asArray()),
              },
            });
          }
        })
      )
    )
      .pipe(take(1))
      .subscribe(() => {
        this[`${hand}GrabbedObject`] = null;
        this.context.signalHub.movement.emit(`${hand}_lost_mesh`, {});
      });
  }

  parentGrabbedMeshIntoHand(
    hand: "left" | "right",
    grabbedMesh: BABYLON.AbstractMesh,
    grabbableComponent: ComponentObj["grabbable"]
  ) {
    if (grabbedMesh.physicsImpostor) {
      grabbedMesh.physicsImpostor.dispose();
      grabbedMesh.physicsImpostor = null;
    }

    this[`${hand}GrabbedObject`] = grabbedMesh;
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
    const multiplier =
      inputSource.motionController.handness[0] === "l" ? 1 : -1;
    const p1 = new BABYLON.Vector3(0.1 * multiplier, 0.1, -0.1);
    const p2 = new BABYLON.Vector3(0, -0.26, 0.024);
    const ray = BABYLON.Ray.CreateNewFromTo(
      p1,
      p2,
      inputSource.grip.getWorldMatrix()
    );
    // const rayHelper = new BABYLON.RayHelper(ray);
    // rayHelper.show(this.context.scene, BABYLON.Color3.Red());
    // try {
    //   showNormals(
    //     inputSource.grip,
    //     1,
    //     BABYLON.Color3.Red(),
    //     this.context.scene
    //   );
    // } catch (e) {
    //   console.log(e);
    // }
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
    console.log("no grab");
    return null;
  }

  process_msg(data: {
    throw: string;
    av: number[];
    lv: number[];
    pos: number[];
    rot: number[];
  }): void {
    // handle throw
    const thrownObject = this.context.scene.getMeshByName(data.throw);
    // reset pos, rot for more accurate client simulations
    thrownObject.position = BABYLON.Vector3.FromArray(data.pos);
    thrownObject.rotation = BABYLON.Vector3.FromArray(data.rot);
    if (!thrownObject.physicsImpostor) {
      thrownObject.physicsImpostor = new BABYLON.PhysicsImpostor(
        thrownObject,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, friction: 0.8, restitution: 0.5 },
        this.context.scene
      );
    }
    thrownObject.physicsImpostor.setLinearVelocity(
      BABYLON.Vector3.FromArray(data.lv)
    );
    thrownObject.physicsImpostor.setAngularVelocity(
      BABYLON.Vector3.FromArray(data.av)
    );
    // in one second, unless canceled by another interaction
    // save the final resting position of the mesh and remove the physics imposter
  }
}
