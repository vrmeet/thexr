<script>
    import { signalHub } from "../signalHub";
    let options = ["box", "cone", "sphere", "grid", "plane", "spawn_point"];
    let selected = "box";
</script>

<h3>Add Entity</h3>
<select bind:value={selected}>
    {#each options as option}
        <option value={option}>{option}</option>
    {/each}
</select>
<button
    on:click={() => {
        console.log(selected);
        signalHub.next({
            event: "spaces_api",
            payload: { func: "add_entity_with_broadcast", args: [selected] },
        });
    }}>Add</button
>
