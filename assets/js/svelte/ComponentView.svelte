<script lang="ts">
    import { getContext, afterUpdate } from "svelte";
    import type { Context } from "../context";
    import Inspect from "./Inspect.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import ComponentValue from "./ComponentValue.svelte";

    export let data: { entity_id: string; componentName: string };

    let context: Context = getContext("context");

    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const mesh = systemTransform.lastPickedMesh;
</script>

<button id="back" on:click={setSelected(Inspect)}>‹ Back</button>
<div id="mesh-name">Object Name: {mesh.name}</div>
<div id="component-name">{data.componentName}</div>
<ComponentValue value={context.state[data.entity_id][data.componentName]} />

<style>
    #back {
        background-color: transparent;
        padding: 0;
    }
    div {
        border: 1px solid pink;
        width: 90%;
        padding-left: 5px;
    }
</style>
