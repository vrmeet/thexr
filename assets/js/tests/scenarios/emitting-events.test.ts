import * as CreateEventHelper from "../../core/entities/event-helper";

describe("emitting events for creating common constructs", () => {
  test("helper makes create a box event payload", () => {
    let event = CreateEventHelper.createBoxEvent({ size: 0.1 });
    expect(event.m).toEqual("entity_created");
    expect(event.p.entity_id.length).toBeGreaterThan(5);
    expect(event.p.components.shape).toBeTruthy();
  });

  test("create a door", () => {
    // this might actually need multiple events if the door comes with multiple moving parts
    // the barrier itself
    // the switch
    let event = CreateEventHelper.createDoorEvent({
      points: [1, 2, 3, 4],
      height: 1.5,
    });
    expect(event.p.components.door).toBeTruthy();
  });
});
