<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import type { Context } from "../context";
    import type * as BABYLON from "babylonjs";
    import Select from "./Select.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import type { ComponentObj } from "../ecs/components/component-obj";
    import type { Subscription } from "rxjs";

    let subscriptions: Subscription[] = [];
    let context: Context = getContext("context");

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div>Name your export</div>
<input id="mesh_name" />
<button id="export">Export</button>

<style>
    #back {
        background-color: transparent;
        padding: 0;
    }
</style>
