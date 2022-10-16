<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import { afterUpdate, onDestroy } from "svelte";
    import * as BABYLON from "babylonjs";
    import type { SystemSerializedMesh } from "../ecs/builtin_systems/system-serialized-mesh";
    import type { SystemMenu } from "../ecs/builtin_systems/system-menu";
    import Primitives from "./Primitives.svelte";
    import { arrayReduceSigFigs } from "../utils/misc";
    import { filter } from "rxjs";
    import Color from "./Color.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";

    let context: Context = getContext("context");
    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");
    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;
    systemTransform.enableGizmoManager();

    const systemSerializedMesh: SystemSerializedMesh = context.systems[
        "serialized_mesh"
    ] as SystemSerializedMesh;
    const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;

    // Add the highlight layer.
    const hl = new BABYLON.HighlightLayer("hl1", context.scene);

    let data = {
        selectedMeshes: [],
        componentsList: [],
        selectedMesh: null,
        prevSelectedMesh: null,
    };

    const clearData = () => {
        data.selectedMeshes.length = 0;
        data.componentsList.length = 0;
        data.selectedMesh = null;
        data.prevSelectedMesh = null;
    };

    onDestroy(() => {
        hl.dispose();
        systemTransform.disableGizmoManager();
    });

    context.signalHub.incoming
        .on("components_upserted")
        .pipe(filter((evt) => evt.id === data.selectedMesh?.name))
        .subscribe(() => {
            const components = context.state[data.selectedMesh?.name];
            if (components) {
                data.componentsList = Object.entries(components).map(
                    ([compName, compValue]) => {
                        return {
                            name: compName,
                            value: JSON.stringify(compValue),
                        };
                    }
                );
            } else {
                data.componentsList.length = 0;
            }
        });

    const refreshData = () => {
        // the red color means selected, the yellow color means last selected
        hl.removeAllMeshes();
        // highlight all meshes in orange first
        data.selectedMeshes.forEach((m) => {
            hl.addMesh(m, BABYLON.Color3.FromHexString("#FFA500"));
        });
        data.selectedMesh = data.selectedMeshes[data.selectedMeshes.length - 1];
        data.prevSelectedMesh =
            data.selectedMeshes[data.selectedMeshes.length - 2];
        if (data.selectedMesh) {
            hl.addMesh(data.selectedMesh as BABYLON.Mesh, BABYLON.Color3.Red());
        }
        if (data.prevSelectedMesh) {
            hl.addMesh(
                data.prevSelectedMesh as BABYLON.Mesh,
                BABYLON.Color3.Yellow()
            );
        }

        if (data.selectedMeshes.length === 1) {
            systemTransform.gizmoManagerAttachMesh(data.selectedMeshes[0]);
        } else {
            systemTransform.gizmoManagerAttachMesh(null);
        }

        const components = context.state[data.selectedMesh?.name];
        if (components) {
            data.componentsList = Object.entries(components).map(
                ([compName, compValue]) => {
                    return { name: compName, value: JSON.stringify(compValue) };
                }
            );
        } else {
            data.componentsList.length = 0;
        }
    };

    if (systemTransform.lastPickedMesh) {
        data.selectedMesh = systemTransform.lastPickedMesh;
        data.selectedMeshes.push(systemTransform.lastPickedMesh);
        refreshData();
    }

    context.signalHub.local.on("mesh_picked").subscribe((meshPicked) => {
        if (meshPicked.metadata?.menu === true) {
            return;
        }
        if (data.selectedMeshes.includes(meshPicked)) {
            const i = data.selectedMeshes.indexOf(meshPicked);
            data.selectedMeshes.splice(i, 1);
        } else {
            data.selectedMeshes.push(meshPicked);
        }
        refreshData();
    });

    afterUpdate(() => {
        systemMenu.renderMenuToTexture();
    });

    const merge = () => {
        const mergedMesh = systemSerializedMesh.merge(data.selectedMeshes);
        clearData();
        data.selectedMeshes.push(mergedMesh);
        refreshData();
    };

    const deleteSelectedMeshes = () => {
        context.signalHub.outgoing.emit("entities_deleted", {
            ids: data.selectedMeshes.map((m) => m.name),
        });
        clearData();
        refreshData();
    };
    const subtractSelectedMeshes = () => {
        const diffMesh = systemSerializedMesh.subtract(
            data.prevSelectedMesh,
            data.selectedMesh
        );
        clearData();
        data.selectedMeshes.push(diffMesh);
        refreshData();
    };
    const intersectSelectedMeshes = () => {
        const intersectedMesh = systemSerializedMesh.intersect(
            data.prevSelectedMesh,
            data.selectedMesh
        );
        clearData();
        data.selectedMeshes.push(intersectedMesh);
        refreshData();
    };
</script>

<button id="goto_primitives" on:click={setSelected(Primitives)}>Add+</button>

<button id="merge" disabled={data.selectedMeshes.length < 2} on:click={merge}
    >Merge</button
>

<button
    disabled={data.selectedMeshes.length < 1}
    on:click={deleteSelectedMeshes}>Delete</button
>

<button
    disabled={data.selectedMeshes.length !== 2}
    on:click={subtractSelectedMeshes}>Subtract</button
>

<button
    disabled={data.selectedMeshes.length != 2}
    on:click={intersectSelectedMeshes}>Intersect</button
>

<button
    disabled={data.selectedMeshes.length !== 1}
    id="goto_color"
    on:click={setSelected(Color, { mesh: data.selectedMesh })}>Color</button
>
<div>{data.selectedMeshes.length} objects selected</div>
{#if data.selectedMeshes.length === 0}
    <div>
        Pick an Object to select it. Shift (Grip in VR) and Pick to select
        multiple objects.
    </div>
{/if}
{#if data.selectedMeshes.length === 1}
    <div>Name: {data.selectedMeshes[0].name}</div>

    {#each data.componentsList as comp}
        <div>{comp.name}</div>
        <div>{comp.value}</div>
    {/each}
{/if}

<style>
    div {
        display: block;
    }
</style>
