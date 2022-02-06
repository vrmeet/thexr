<script lang="ts">
    export let component: { type: string; data: any };
    export let highlightComponent;
    export let highlighted: boolean;
    export let entity;
</script>

<div
    on:click={() => {
        highlightComponent(component);
    }}
>
    {component.type}
</div>
<form
    on:change|preventDefault={(event) => {
        console.log(entity.id, component.type, component.data);
    }}
>
    {#if highlighted}
        {#each Object.keys(component.data) as key}
            <div>{key}</div>
            <input type="text" name={key} bind:value={component.data[key]} />
        {/each}
    {/if}
</form>
