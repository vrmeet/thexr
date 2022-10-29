<script lang="ts">
    import { getContext, afterUpdate } from "svelte";
    import type { Context } from "../context";
    import type * as BABYLON from "babylonjs";
    import Select from "./Select.svelte";
    import type { SystemSerializedMesh } from "../ecs/builtin_systems/system-serialized-mesh";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";

    import type { ComponentObj } from "../ecs/components/component-obj";
    import type { Subscription } from "rxjs";
    import { cameraFrontPosition, random_id } from "../utils/misc";
    import type { SystemMenu } from "../ecs/builtin_systems/system-menu";

    export let value;
    console.log("value is", value);
    let context: Context = getContext("context");
</script>

{#if Array.isArray(value)}
    <div class="array_input">
        {#each value as item, i}
            <input id="input-{i}" value={item} />
        {/each}
    </div>
{:else if value !== null && typeof value === "object"}
    {#each Object.entries(value) as entry}
        <div id="object-{entry[0]}">
            <div id="object-name">{entry[0]}</div>
            <svelte:self value={entry[1]} />
        </div>
    {/each}
{:else}
    <input id="scale-{value}" {value} />
{/if}

<style>
    div {
        position: relative;
        background-color: darkolivegreen;
        /* border: 1px solid black; */
        width: 90%;
        padding-left: 5px;
    }
    input {
        width: 100%;
    }
</style>
