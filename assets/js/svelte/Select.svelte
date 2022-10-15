<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import { afterUpdate, onDestroy } from "svelte";
    import * as BABYLON from "babylonjs";
    import type { SystemSerializedMesh } from "../ecs/builtin_systems/system-serialized-mesh";
    import { arrayReduceSigFigs } from "../utils/misc";
    import { filter } from "rxjs";

    let context: Context = getContext("context");
    const systemSerializedMesh: SystemSerializedMesh = context.systems[
        "serialized_mesh"
    ] as SystemSerializedMesh;

    let updateCallback: () => void = getContext("updateCallback");

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

    const gizmoManager = new BABYLON.GizmoManager(context.scene);
    console.log("gizmoManager", gizmoManager);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.gizmos.positionGizmo.scaleRatio = 2;
    gizmoManager.gizmos.rotationGizmo.scaleRatio = 1.5;
    gizmoManager.scaleGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;

    gizmoManager.gizmos.positionGizmo.onDragEndObservable.add((data, state) => {
        broadcastNewPosition();
    });

    gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add((data, state) => {
        broadcastNewRotation();
    });

    gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add((data, state) => {
        broadcastNewScale();
    });

    onDestroy(() => {
        hl.dispose();
        gizmoManager.dispose();
    });

    const broadcastNewPosition = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: data.selectedMesh.name,
            components: {
                transform: {
                    position: arrayReduceSigFigs(
                        data.selectedMesh.position.asArray()
                    ),
                },
            },
        });
    };

    const broadcastNewRotation = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: data.selectedMesh.name,
            components: {
                transform: {
                    rotation: arrayReduceSigFigs(
                        data.selectedMesh.rotation.asArray()
                    ),
                },
            },
        });
    };

    const broadcastNewScale = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: data.selectedMesh.name,
            components: {
                transform: {
                    scaling: arrayReduceSigFigs(
                        data.selectedMesh.scaling.asArray()
                    ),
                },
            },
        });
    };

    context.signalHub.incoming
        .on("components_upserted")
        .pipe(filter((evt) => evt.id === data.selectedMesh?.name))
        .subscribe(() => {
            console.log("updating");
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
        console.log(
            "selectedMeshes",
            data.selectedMeshes.map((m) => m.name)
        );
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
            gizmoManager.attachToMesh(data.selectedMeshes[0]);
        } else {
            gizmoManager.attachToMesh(null);
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
        updateCallback();
    });

    const merge = () => {
        const mergedMesh = systemSerializedMesh.merge(data.selectedMeshes);
        data.selectedMeshes.length = 0;
        data.selectedMeshes.push(mergedMesh);
        refreshData();
    };

    const deleteSelectedMeshes = () => {
        context.signalHub.outgoing.emit("entities_deleted", {
            ids: data.selectedMeshes.map((m) => m.name),
        });
        data.selectedMeshes.length = 0;
        refreshData();
    };
</script>

{#if data.selectedMeshes.length !== 1}
    <div>{data.selectedMeshes.length} objects selected</div>
{:else}
    <div>Name: {data.selectedMeshes[0].name}</div>

    {#each data.componentsList as comp}
        <div>{comp.name}</div>
        <div>{comp.value}</div>
    {/each}
{/if}

{#if data.selectedMeshes.length > 1}
    <button on:click={merge}>Merge</button>
{/if}
{#if data.selectedMeshes.length >= 1}
    <button on:click={deleteSelectedMeshes}>Delete</button>
{/if}

<style>
    div {
        display: block;
    }
</style>
