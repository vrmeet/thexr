<script lang="ts">
    import { getContext, afterUpdate } from "svelte";
    import type { Context } from "../context";
    import Select from "./Select.svelte";
    import type { SystemTransform } from "../ecs/builtin_systems/system-transform";
    import ComponentView from "./ComponentView.svelte";
    import type { SystemMenu } from "../ecs/builtin_systems/system-menu";

    let context: Context = getContext("context");
    const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;
    const systemTransform: SystemTransform = context.systems[
        "transform"
    ] as SystemTransform;

    let setSelected: (component: any, data?: {}) => () => void =
        getContext("setSelected");

    const mesh = systemTransform.lastPickedMesh;
    const existingComponentNames = Object.keys(context.state[mesh.name]);
    const fullComponentNames = ["floor", "grabbable"];
    const availableComponentsToAdd = fullComponentNames.filter(
        (el) => !existingComponentNames.includes(el)
    );
    const addComponent = (componentName: string) => {
        return () => {
            if (componentName === "floor") {
                context.signalHub.outgoing.emit("components_upserted", {
                    id: mesh.name,
                    components: {
                        floor: {},
                    },
                });
            } else if (componentName === "grabbable") {
                context.signalHub.outgoing.emit("components_upserted", {
                    id: mesh.name,
                    components: {
                        grabbable: {
                            pickup: "any",
                            throwable: true,
                        },
                    },
                });
            }
            console.log("i want to add component", componentName);
        };
    };
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div>Object Name: {mesh.name}</div>
<div>Components:</div>
{#each existingComponentNames as componentName}
    <button
        class="view_component"
        on:click={setSelected(ComponentView, {
            entity_id: mesh.name,
            componentName,
        })}>{componentName}</button
    >
{/each}
<div>Add:</div>
{#each availableComponentsToAdd as componentName}
    <button
        class="add_component"
        id="add-${componentName}"
        on:click={addComponent(componentName)}>{componentName}</button
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
    .add_component {
        width: 30%;
    }
</style>
