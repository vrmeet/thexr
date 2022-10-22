<script lang="ts">
    import { getContext, afterUpdate } from "svelte";
    import type { Context } from "../context";
    import Select from "./Select.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import ComponentView from "./ComponentView.svelte";

    let context: Context = getContext("context");

    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const mesh = systemTransform.lastPickedMesh;
    const componentNames = Object.keys(context.state[mesh.name]);
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div>Object Name: {mesh.name}</div>
{#each componentNames as componentName}
    <button
        class="view_component"
        on:click={setSelected(ComponentView, {
            entity_id: mesh.name,
            componentName,
        })}>{componentName}</button
    >
{/each}

<style>
    #back {
        background-color: transparent;
        padding: 0;
    }
    .view_component {
        display: block;
        width: 50%;
    }
</style>
