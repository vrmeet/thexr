/// <reference types="svelte" />

import { describeResults } from "./specs/helper/runner";
import "./specs/specs/util-spec";
import "./specs/specs/some-other-spec.ts";
import DisplayTests from "./specs/helper/DisplayTests.svelte";

let target = document.getElementById("test-results");

new DisplayTests({ target: target, props: { describeResults } });
