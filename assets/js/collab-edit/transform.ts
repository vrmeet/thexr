import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { filter } from "rxjs/operators";
import { EventName } from "../event-names";
import type { EntityBase } from "../scene/entity-base";
import { signalHub } from "../signalHub";
import type { Component, event } from "../types";
import { arrayReduceSigFigs } from "../utils/misc";

export class CollaborativeEditTransformManager {
  public selectedMesh: BABYLON.AbstractMesh;
  public gizmoManager: BABYLON.GizmoManager;
  public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>;

  constructor(public scene: BABYLON.Scene) {
    signalHub.menu.on("menu_editing_tool").subscribe(editing => {
      if (editing === "transform") {
        this.on();
      } else {
        this.off();
      }
    });
  }

  dispose() {
    if (this.gizmoManager) {
      this.gizmoManager.dispose();
    }
  }

  off() {
    this.scene.onPointerObservable.remove(this.pointerObs);
    this.disableTransformGizmo();
  }

  on() {
    // pay attention to click on util layer
    this.enableTransformGizmo();

    // pay attention to click and double click on the scene
    this.pointerObs = this.scene.onPointerObservable.add(evt => {
      if (evt.type === BABYLON.PointerEventTypes.POINTERPICK) {
        let mesh = evt.pickInfo.pickedMesh;

        if (mesh && BABYLON.Tags.MatchesQuery(mesh, "editable")) {
          this.selectMesh(mesh);
        }
      }
    });
  }

  selectMesh(mesh: BABYLON.AbstractMesh) {
    if (this.selectedMesh) {
      // there is nothing todo if this mesh is already selected
      if (this.selectedMesh.name === mesh.name) {
        return;
      }
    }

    this.gizmoManager.attachToMesh(mesh);

    this.selectedMesh = mesh;
  }

  disableTransformGizmo() {
    if (this.gizmoManager) {
      this.gizmoManager.dispose();
    }
  }

  enableTransformGizmo() {
    this.gizmoManager = new BABYLON.GizmoManager(this.scene);

    this.gizmoManager.positionGizmoEnabled = true;
    this.gizmoManager.rotationGizmoEnabled = true;
    this.gizmoManager.gizmos.positionGizmo.scaleRatio = 2;
    this.gizmoManager.gizmos.rotationGizmo.scaleRatio = 1.5;
    this.gizmoManager.scaleGizmoEnabled = true;
    // this.gizmoManager.boundingBoxGizmoEnabled = true;
    this.gizmoManager.usePointerToAttachGizmos = false;

    this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(
      (data, state) => {
        this.broadcastNewPosition();
      }
    );

    this.gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add(
      (data, state) => {
        this.broadcastNewRotation();
      }
    );

    this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(
      (data, state) => {
        this.broadcastNewScale();
      }
    );

    // this.gizmoManager.gizmos.boundingBoxGizmo.onRotationSphereDragEndObservable.add((data, state) => {
    //     this.broadcastNewRotation()
    // })

    // this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragEndObservable.add((data, state) => {
    //     this.broadcastNewPosition()
    //     this.broadcastNewScale()
    // })
  }

  broadcastNewPosition() {
    const pos = this.selectedMesh.position;
    const components: Component[] = [
      { type: "position", data: { value: arrayReduceSigFigs(pos.asArray()) } },
    ];
    const event: event = {
      m: EventName.entity_transformed,
      p: { id: this.selectedMesh.id, components: components },
    };
    signalHub.outgoing.emit("event", event);

    let entity: EntityBase = this.selectedMesh.metadata.ref;
    entity.setComponentByType("position", components[0].data.value);

    // signalHub.outgoing.emit('spaces_api', {
    //     func: "modify_component_with_broadcast",
    //     args: [this.selectedMesh.id, "position", { x: pos.x, y: pos.y, z: pos.z }],
    // });
  }

  broadcastNewRotation() {
    let rot;
    if (this.selectedMesh.rotationQuaternion) {
      rot = this.selectedMesh.rotationQuaternion.toEulerAngles();
    } else {
      rot = this.selectedMesh.rotation;
    }

    const components: Component[] = [
      { type: "rotation", data: { value: arrayReduceSigFigs(rot.asArray()) } },
    ];
    const event: event = {
      m: EventName.entity_transformed,
      p: { id: this.selectedMesh.id, components: components },
    };
    signalHub.outgoing.emit("event", event);

    // signalHub.outgoing.emit('spaces_api', {
    //     func: "modify_component_with_broadcast",
    //     args: [this.selectedMesh.id, "rotation", { x: rot.x, y: rot.y, z: rot.z }],
    // });
  }

  broadcastNewScale() {
    const scaling = this.selectedMesh.scaling;

    const components: Component[] = [
      {
        type: "scaling",
        data: { value: arrayReduceSigFigs(scaling.asArray()) },
      },
    ];
    const event: event = {
      m: EventName.entity_transformed,
      p: { id: this.selectedMesh.id, components: components },
    };
    signalHub.outgoing.emit("event", event);
    // signalHub.outgoing.emit('spaces_api', {
    //     func: "modify_component_with_broadcast",
    //     args: [this.selectedMesh.id, "scale", { x: scale.x, y: scale.y, z: scale.z }],
    // });
  }
}
