<script lang="ts">
    import { signalHub } from "../signalHub";
    import Vector3ComponentForm from "./Vector3ComponentForm.svelte";
    import ColorStringComponentForm from "./ColorStringComponentForm.svelte";
    import ComponentForm from "./ComponentForm.svelte";
    export let component: { type: string; data: any };
    export let highlightComponent;
    export let highlighted: boolean;
    export let entity;
    // callbacks
    const update = () => {
        signalHub.next({
            event: "spaces_api",
            payload: {
                func: "modify_component_with_broadcast",
                args: [entity.id, component.type, component.data],
            },
        });
    };
</script>

<li>
    <div
        on:click={() => {
            highlightComponent(component);
        }}
    >
        {component.type}
    </div>

    {#if highlighted}
        <ul>
            {#if ["position", "rotation", "scale"].includes(component.type)}
                <Vector3ComponentForm {component} {update} />
            {:else if ["color"].includes(component.type)}
                <ColorStringComponentForm {component} {update} />
            {:else}
                <ComponentForm {component} />
            {/if}
        </ul>
    {/if}
</li>
