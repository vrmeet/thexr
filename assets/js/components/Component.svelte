<script lang="ts">
    import { signalHub } from "../signalHub";
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

<div
    on:click={() => {
        highlightComponent(component);
    }}
>
    {component.type}
</div>
<form
    on:submit|preventDefault={update}
    on:change|preventDefault={update}
    on:blur|preventDefault={update}
>
    {#if highlighted}
        {#each Object.keys(component.data) as key}
            <div>{key}</div>
            <input type="text" name={key} bind:value={component.data[key]} />
        {/each}
    {/if}
</form>
