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
    this.name = "acts_like_lift";
    this.order = 20;
  }
  init(context) {
    this.context = context;
    this.meshPickedSubscription = context.signalHub.local.on("mesh_picked").subscribe((mesh) => {
      if (this.meshIsALift(mesh)) {
        this.toggleLift(mesh);
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
  upsertComponents(entity_id, components) {
    if (components.acts_like_lift !== void 0) {
      const mesh = this.context.scene.getMeshByName(entity_id);
      if (mesh) {
        if (components.acts_like_lift.state === "going-down") {
          this.goDown(mesh);
        } else if (components.acts_like_lift.state === "going-up") {
          this.goUp(mesh);
        }
      }
    }
  }
  deregisterEntity(_entity_id) {
  }
  meshIsALift(mesh) {
    return this.context.state[mesh.name] !== void 0 && this.context.state[mesh.name]["acts_like_lift"] !== void 0;
  }
  toggleLift(mesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
    if (liftState.state === "up") {
      liftState.state = "going-down";
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "going-down" })
        }
      });
    } else if (liftState.state === "down") {
      liftState.state = "going-up";
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "going-up" })
        }
      });
    }
  }
  goDown(mesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
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
            transform: { position: mesh.position.asArray() }
          }
        });
      }
    });
  }
  goUp(mesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.add(
        new this.context.BABYLON.Vector3(0, liftState.height, 0)
      ),
      duration: liftState.height / liftState.speed,
      callback: () => {
        this.context.signalHub.outgoing.emit("components_upserted", {
          id: mesh.name,
          components: {
            acts_like_lift: __spreadProps(__spreadValues({}, liftState), { state: "up" }),
            transform: { position: mesh.position.asArray() }
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
