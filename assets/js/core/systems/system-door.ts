import type { Entity } from "../entities/entity";
import type * as BABYLON from "babylonjs";

export class SystemDoor {
  public name = "acts_like_door";
  public entity: Entity;
  public state: "up" | "down";
  public observer;
  init() {
    this.state = "down";
  }
  goUp() {
    console.log("going up");
    this.state = "up";
  }
  goDown() {
    console.log("going down");
    this.state = "down";
  }
  meshClicked(event: BABYLON.PointerInfo) {
    return (
      event.pickInfo.hit &&
      event.pickInfo.pickedMesh.id === this.entity.mesh?.id
    );
  }
  attach(entity: Entity) {
    this.entity = entity;
    // add listener for a pointer event on this mesh

    this.observer = entity.scene.onPointerObservable.add(event => {
      if (this.meshClicked(event)) {
        if (this.state === "down") {
          this.goUp();
        } else {
          this.goDown();
        }
      }
    });
  }
  detach() {
    this.entity.scene.onPointerObservable.remove(this.observer);
  }
}
