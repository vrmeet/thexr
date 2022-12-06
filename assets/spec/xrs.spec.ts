import { XRS } from "../js/xrs-ecs/xrs";
import { ComponentShape, SystemShape } from "../js/xrs-ecs/systems/shape";
import { SystemScene } from "../js/xrs-ecs/systems/scene";
import * as BABYLON from "babylonjs";
describe("when receiving messages", function () {
  const xrspace = new XRS({
    my_member_id: "abc",
    space: { id: "11", name: "jfds", state_id: "jdks" },
    webrtc_channel_id: "kd",
    userToken: "jkfds",
    engine: new BABYLON.NullEngine(),
  });
  class TestComponent {
    add(target) {}
    update(data) {}
    remove() {}
  }
  xrspace.registerSystem({
    name: "fireplace",
    init: () => {},
    buildComponent: () => new TestComponent(),
  });

  it("can register systems", () => {
    expect(xrspace.getSystem("fireplace").name === "fireplace").toBe(true);
  });
  it("creates an entity", () => {
    const entity = xrspace.createEntity("box");
    expect(xrspace.getEntity("box").name == entity.name).toBe(true);
  });
  it("add a component", () => {
    const entity = xrspace.createEntity("box");
    entity.addComponent("fireplace", { foo: 123 });
  });
  it("receives message to create a box", () => {
    window["a"] = xrspace;
    const entity = xrspace.createEntity("abc");
    entity.addComponent("shape", { shape: "box", options: {} });
  });
  // get a few remote events, build up state locally
  // should trigger behaviors on the components
  // create a box
  // move a box
  // delete a box
  // color a box
});
