<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import { afterUpdate, onDestroy } from "svelte";
    import * as BABYLON from "babylonjs";
    import { arrayReduceSigFigs } from "../utils/misc";
    import { filter } from "rxjs";
    let context: Context = getContext("context");
    let updateCallback: () => void = getContext("updateCallback");
    let selectedMesh;
    let componentsList = [];
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
        gizmoManager.dispose();
    });

    const broadcastNewPosition = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: selectedMesh.name,
            components: {
                transform: {
                    position: arrayReduceSigFigs(
                        selectedMesh.position.asArray()
                    ),
                },
            },
        });
    };

    const broadcastNewRotation = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: selectedMesh.name,
            components: {
                transform: {
                    rotation: arrayReduceSigFigs(
                        selectedMesh.rotation.asArray()
                    ),
                },
            },
        });
    };

    const broadcastNewScale = () => {
        context.signalHub.outgoing.emit("components_upserted", {
            id: selectedMesh.name,
            components: {
                transform: {
                    scaling: arrayReduceSigFigs(selectedMesh.scaling.asArray()),
                },
            },
        });
    };

    context.signalHub.incoming
        .on("components_upserted")
        .pipe(filter((evt) => evt.id === selectedMesh?.name))
        .subscribe(() => {
            console.log("updating");
            const components = context.state[selectedMesh.name];
            if (components) {
                componentsList = Object.entries(components).map(
                    ([compName, compValue]) => {
                        return {
                            name: compName,
                            value: JSON.stringify(compValue),
                        };
                    }
                );
            } else {
                componentsList.length = 0;
            }
        });

    context.signalHub.local.on("mesh_picked").subscribe((meshPicked) => {
        selectedMesh = meshPicked;
        gizmoManager.attachToMesh(selectedMesh);
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
