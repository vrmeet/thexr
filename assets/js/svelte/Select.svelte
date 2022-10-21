<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import { afterUpdate, onDestroy } from "svelte";
    import * as BABYLON from "babylonjs";
    import type { SystemSerializedMesh } from "../ecs/builtin_systems/system-serialized-mesh";
    import type { SystemMenu } from "../ecs/builtin_systems/system-menu";
    import Primitives from "./Primitives.svelte";
    import {
        arrayReduceSigFigs,
        cameraFrontPosition,
        random_id,
    } from "../utils/misc";
    import { filter, mapTo, Subscription } from "rxjs";
    import Color from "./Color.svelte";
    import Export from "./Export.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import { merge as rxjsmerge, tap } from "rxjs";

    let subscriptions: Subscription[] = [];
    const keyCodeForShift = 16;
    let data = {
        selectedMeshes: [],
        componentsList: [],
        selectedMesh: null,
        prevSelectedMesh: null,
        shiftDown: false,
        leftGripDown: false,
        rightGripDown: false,
    };

    let context: Context = getContext("context");

    const sub1 = context.signalHub.local
        .on("keyboard_info")
        .pipe(filter((info) => info.event.keyCode === keyCodeForShift))
        .subscribe((info) => {
            if (info.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                data.shiftDown = true;
            } else if (info.type === BABYLON.KeyboardEventTypes.KEYUP) {
                data.shiftDown = false;
            }
        });
    subscriptions.push(sub1);

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

    const clearData = () => {
        data.selectedMeshes.length = 0;
        data.componentsList.length = 0;
        data.selectedMesh = null;
        data.prevSelectedMesh = null;
    };

    const sub2 = context.signalHub.incoming
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

    subscriptions.push(sub2);

    const refreshData = () => {
        hl.removeAllMeshes();
        data.selectedMesh = data.selectedMeshes[data.selectedMeshes.length - 1];
        data.prevSelectedMesh =
            data.selectedMeshes[data.selectedMeshes.length - 2];

        if (data.selectedMeshes.length > 1) {
            // the red color means selected, the yellow color means last selected
            // highlight all meshes in orange first
            data.selectedMeshes.forEach((m) => {
                hl.addMesh(m, BABYLON.Color3.FromHexString("#FFA500"));
            });
            if (data.selectedMesh) {
                hl.addMesh(
                    data.selectedMesh as BABYLON.Mesh,
                    BABYLON.Color3.Red()
                );
            }
            if (data.prevSelectedMesh) {
                hl.addMesh(
                    data.prevSelectedMesh as BABYLON.Mesh,
                    BABYLON.Color3.Yellow()
                );
            }
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

    const sub3 = context.signalHub.local
        .on("mesh_picked")
        .subscribe((meshPicked) => {
            if (meshPicked.metadata?.menu === true) {
                return;
            }

            if (data.selectedMeshes.includes(meshPicked)) {
                // if already selected, deselect
                const i = data.selectedMeshes.indexOf(meshPicked);
                data.selectedMeshes.splice(i, 1);
            } else {
                // TODO, need to inspect the current state of the hand that was doing the picking, whether grip was also held
                if (
                    !data.shiftDown &&
                    !data.leftGripDown &&
                    !data.rightGripDown
                ) {
                    clearData();
                }
                data.selectedMeshes.push(meshPicked);
            }

            refreshData();
        });
    subscriptions.push(sub3);

    const sub4 = rxjsmerge(
        context.signalHub.movement.on("left_grip_squeezed").pipe(
            tap(() => {
                data.leftGripDown = true;
            })
        ),
        context.signalHub.movement.on("left_grip_released").pipe(
            tap(() => {
                data.leftGripDown = false;
            })
        ),

        context.signalHub.movement.on("right_grip_squeezed").pipe(
            tap(() => {
                data.rightGripDown = true;
            })
        ),
        context.signalHub.movement.on("right_grip_released").pipe(
            tap(() => {
                data.rightGripDown = false;
            })
        )
    ).subscribe();
    subscriptions.push(sub4);

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

    const duplicateMesh = () => {
        if (!context.state[data.selectedMesh.name]) {
            console.warn("can't duplicate");
            return;
        }
        const newComponents = { ...context.state[data.selectedMesh.name] };
        // initialize if no transform or no transform.position
        if (!newComponents.transform) {
            newComponents.transform = { position: [0, 0, 0] };
        } else if (!newComponents.transform.position) {
            newComponents.transform.position = [0, 0, 0];
        }

        newComponents.transform.position = cameraFrontPosition(
            context.scene,
            2
        );

        context.signalHub.outgoing.emit("entity_created", {
            id: `dup_${random_id(5)}`,
            components: newComponents,
        });
    };

    afterUpdate(() => {
        systemMenu.refresh(document.getElementById("menu_right"));

        // systemMenu.renderMenuToTexture();
    });

    onDestroy(() => {
        subscriptions.forEach((sub) => sub.unsubscribe());
        hl.dispose();
        systemTransform.disableGizmoManager();
    });
</script>

<button id="goto_primitives" on:click={setSelected(Primitives)}>Add+</button>

<button
    disabled={data.selectedMeshes.length < 1}
    on:click={deleteSelectedMeshes}>Delete</button
>

<button disabled={data.selectedMeshes.length !== 1} on:click={duplicateMesh}
    >Duplicate</button
>

<button
    disabled={data.selectedMeshes.length !== 1}
    id="goto_color"
    on:click={setSelected(Color)}>Color</button
>

<button
    disabled={data.selectedMeshes.length !== 1}
    id="goto_export"
    on:click={setSelected(Export)}>Export</button
>

<div>Boolean Operations</div>
<button id="merge" disabled={data.selectedMeshes.length < 2} on:click={merge}
    >Merge</button
>

<button
    disabled={data.selectedMeshes.length !== 2}
    on:click={subtractSelectedMeshes}>Subtract</button
>

<button
    disabled={data.selectedMeshes.length !== 2}
    on:click={intersectSelectedMeshes}>Intersect</button
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
