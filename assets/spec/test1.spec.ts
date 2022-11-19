import { reduceSigFigs } from "../js/utils/misc";
describe("A suite", function () {
  it("contains spec with an expectation", function () {
    console.log("where does this go ooo?");
    window["thing"] = { lol: "bro" };
    console.log("reduced", reduceSigFigs(23.234324));
    expect(true).toBe(true);
  });
});
