import { XRS } from "../js/xrs";
describe("when receiving messages", function () {
  const xrspace = new XRS();
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
  console.log("xrspace", xrspace);
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
  // get a few remote events, build up state locally
  // should trigger behaviors on the components
  // create a box
  // move a box
  // delete a box
  // color a box
});
