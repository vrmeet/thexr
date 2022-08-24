/// <reference types="svelte" />

import { describeResults } from "./specs/helper/runner";

/* specs */
import "./specs/specs/systems/shape.test";

import DisplayTests from "./specs/helper/DisplayTests.svelte";

let target = document.getElementById("test-results");

new DisplayTests({ target: target, props: { describeResults } });
