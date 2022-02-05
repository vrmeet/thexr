<script lang="ts">
    export let data: any;
    export let type: string;
</script>

<div>{type}</div>
<form
    on:change|preventDefault={(event) => {
        console.log({ type, data });
    }}
>
    {#each Object.keys(data) as key}
        <div>{key}</div>
        <input type="text" name={key} bind:value={data[key]} />
    {/each}
</form>
