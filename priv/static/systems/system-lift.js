class SystemLift {
  constructor() {
    this.name = "system-lift";
  }
  init(context) {
    this.context = context;
    this.meshPickedSubscription = context.signalHub.local.on("mesh_picked").subscribe((mesh) => {
      console.log("inside mesh_picked", mesh);
      const liftState = this.meshIsALift(mesh);
      if (liftState) {
        this.toggleLift(mesh, liftState);
      }
    });
  }
  initEntity(entity_id, components) {
    if (components.acts_like_lift) {
      this.context.state[entity_id]["acts_like_lift"] = {
        height: components.acts_like_lift.height || 2,
        speed: components.acts_like_lift.speed || 1,
        state: components.acts_like_lift.state || "down"
      };
    }
  }
  meshIsALift(mesh) {
    return this.context.state[mesh.name]["acts_like_lift"];
  }
  toggleLift(mesh, liftState) {
    if (liftState.state === "up") {
      this.goDown(mesh, liftState);
    } else if (liftState.state === "down") {
      this.goUp(mesh, liftState);
    }
  }
  goDown(mesh, liftState) {
    liftState.state = "going-down";
    console.log("going down");
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.subtractFromFloats(0, liftState.height, 0),
      duration: liftState.height / liftState.speed,
      callback: () => {
        liftState.state = "down";
        console.log("down");
      }
    });
  }
  goUp(mesh, liftState) {
    liftState.state = "going-up";
    console.log("going up", liftState);
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.add(new this.context.BABYLON.Vector3(0, liftState.height, 0)),
      duration: liftState.height / liftState.speed,
      callback: () => {
        console.log("animation ended");
        liftState.state = "up";
      }
    });
  }
  dispose() {
    this.meshPickedSubscription.unsubscribe();
  }
}
window["system-lift"] = new SystemLift();
