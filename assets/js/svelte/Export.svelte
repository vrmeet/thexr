<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import type { Context } from "../context";
    import type * as BABYLON from "babylonjs";
    import Select from "./Select.svelte";
    import type { SystemSerializedMesh } from "../ecs/builtin_systems/system-serialized-mesh";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";

    import type { ComponentObj } from "../ecs/components/component-obj";
    import type { Subscription } from "rxjs";
    import { random_id } from "../utils/misc";

    let subscriptions: Subscription[] = [];
    let context: Context = getContext("context");

    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;

    const systemSerializedMesh: SystemSerializedMesh = context.systems[
        "serialized_mesh"
    ] as SystemSerializedMesh;

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const exportMesh = () => {
        systemSerializedMesh.exportMesh(
            `${random_id(5)}`,
            systemTransform.lastPickedMesh
        );
    };
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div>Name your export</div>
<input id="mesh_name" />
<button on:click={exportMesh} id="export">Export</button>

<style>
    #back {
        background-color: transparent;
        padding: 0;
    }
</style>
