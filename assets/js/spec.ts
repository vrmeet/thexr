/// <reference types="svelte" />

import { it, assert, runTests } from "./specs/helper/runner";
import "./specs/specs/util-spec";
import "./specs/specs/some-other-spec.ts";
import DisplayTests from "./specs/helper/DisplayTests.svelte";
let results = runTests();

let target = document.getElementById("test-results");
console.log("target", target);
new DisplayTests({ target: target, props: { results } });
