<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import { afterUpdate } from "svelte";
    let context: Context = getContext("context");
    let updateCallback: () => void = getContext("updateCallback");
    let selectedMesh;
    let componentsList = [];
    context.signalHub.local.on("mesh_picked").subscribe((meshPicked) => {
        selectedMesh = meshPicked;
        const components = context.state[meshPicked.name];
        if (components) {
            componentsList = Object.entries(components).map(
                ([compName, compValue]) => {
                    return { name: compName, value: JSON.stringify(compValue) };
                }
            );
        } else {
            componentsList.length = 0;
        }
    });

    afterUpdate(() => {
        updateCallback();
    });
</script>

{#if !selectedMesh}
    <div>No Object selected</div>
{:else}
    <div>Name: {selectedMesh.name}</div>

    {#each componentsList as comp}
        <div>{comp.name}</div>
        <div>{comp.value}</div>
    {/each}
{/if}

<style>
    div {
        display: block;
    }
</style>
