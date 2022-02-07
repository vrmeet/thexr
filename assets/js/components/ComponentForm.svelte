<script>
    export let component;
</script>

{#each Object.keys(component.data) as key}
    <li>
        <div>{key}</div>
        <input type="text" name={key} bind:value={component.data[key]} />
    </li>
{/each}
