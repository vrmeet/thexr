var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
class SystemLift {
  constructor() {
    this.name = "system-lift";
    this.order = 20;
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
  registerEntity(entity_id, components) {
    if (components.acts_like_lift !== void 0) {
      this.context.state[entity_id]["acts_like_lift"] = {
        height: components.acts_like_lift.height || 2,
        speed: components.acts_like_lift.speed || 1,
        state: components.acts_like_lift.state || "down"
      };
    }
  }
  upsertComponents(entity_id, oldComponents, newComponents) {
    if (newComponents.acts_like_lift !== void 0) {
      const mesh = this.context.scene.getMeshByName(entity_id);
      if (mesh) {
        if (newComponents.acts_like_lift.state === "going-down") {
          this.goDown(mesh, newComponents.acts_like_lift);
        } else if (newComponents.acts_like_lift.state === "going-up") {
          this.goUp(mesh, newComponents.acts_like_lift);
        }
      }
    }
  }
  deregisterEntity(_entity_id) {
  }
  meshIsALift(mesh) {
    return this.context.state[mesh.name]["acts_like_lift"];
  }
  toggleLift(mesh, liftState) {
    if (liftState.state === "up") {
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "going-down" })
        }
      });
    } else if (liftState.state === "down") {
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "going-up" })
        }
      });
    }
  }
  goDown(mesh, liftState) {
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.subtractFromFloats(0, liftState.height, 0),
      duration: liftState.height / liftState.speed,
      callback: () => {
        this.context.signalHub.outgoing.emit("components_upserted", {
          id: mesh.name,
          components: {
            acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "down" }),
            position: mesh.position.asArray()
          }
        });
      }
    });
  }
  goUp(mesh, liftState) {
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.add(new this.context.BABYLON.Vector3(0, liftState.height, 0)),
      duration: liftState.height / liftState.speed,
      callback: () => {
        this.context.signalHub.outgoing.emit("components_upserted", {
          id: mesh.name,
          components: {
            acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "up" }),
            position: mesh.position.asArray()
          }
        });
      }
    });
  }
  dispose() {
    this.meshPickedSubscription.unsubscribe();
  }
}
window["system-lift"] = new SystemLift();
