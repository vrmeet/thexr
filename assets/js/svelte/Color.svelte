<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import type { Context } from "../context";
    import type * as BABYLON from "babylonjs";
    import Select from "./Select.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import type { ComponentObj } from "../ecs/components/component-obj";

    let context: Context = getContext("context");

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;
    systemTransform.enableGizmoManager();

    context.signalHub.local.on("mesh_picked").subscribe((meshPicked) => {
        if (meshPicked.metadata?.menu === true) {
            return;
        }
        systemTransform.gizmoManagerAttachMesh(meshPicked);
    });

    let meshMaterial = context.state[systemTransform.lastPickedMesh.name]
        ?.material as { color_string: string };
    let chosenColor: BABYLON.Color3;
    context.signalHub.local.on("color_picked").subscribe((color) => {
        chosenColor = color;
    });
    const applyColor = () => {
        console.log("applying color", chosenColor.toHexString());
        context.signalHub.outgoing.emit("components_upserted", {
            id: systemTransform.lastPickedMesh.name,
            components: {
                material: {
                    name: "color",
                    color_string: chosenColor.toHexString(),
                },
            },
        });
    };

    onDestroy(() => {
        systemTransform.disableGizmoManager();
    });
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>

<div
    id="colorpicker"
    data-meshcolor={meshMaterial?.color_string || "#FFFFFF"}
/>

<button id="apply_color" on:click={applyColor}>Apply</button>

<style>
    #apply_color {
        position: absolute;
        right: 10%;
        bottom: 10%;
    }
    #back {
        background-color: transparent;
        padding: 0;
    }
    #colorpicker {
        border: 1px solid red;
        width: 60%;
    }
</style>
