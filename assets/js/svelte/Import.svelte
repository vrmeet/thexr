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

    let subscriptions: Subscription[] = [];
    let context: Context = getContext("context");
    const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;

    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;

    const systemSerializedMesh: SystemSerializedMesh = context.systems[
        "serialized_mesh"
    ] as SystemSerializedMesh;

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const importMesh = async () => {
        const mesh_id = (
            document.getElementById("mesh_id_input") as HTMLInputElement
        ).value;
        context.signalHub.outgoing.emit("entity_created", {
            id: `imported_${random_id(5)}`,
            components: {
                serialized_mesh: {
                    mesh_id: mesh_id,
                    path: `/objects/${mesh_id}`,
                },
                transform: {
                    position: cameraFrontPosition(context.scene, 2),
                },
            },
        });
    };

    afterUpdate(() => {
        const el = document.getElementById("import_mesh_btn");
        if (el) {
            systemMenu.refresh(el);
        }
    });
    let mesh_id = "";
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div>ID of Mesh to Import</div>
<input id="mesh_id_input" bind:value={mesh_id} />
<button
    id="import_mesh_btn"
    disabled={mesh_id.length == 0}
    on:click={importMesh}>Import</button
>

<style>
    #back {
        background-color: transparent;
        padding: 0;
    }
</style>
