<script lang="ts">
    import Settings from "./Settings.svelte";
    import EntityList from "./EntityList.svelte";
    export let toggleShowMainMenu;
    let selectedTab = null;
</script>

<div class="container">
    <div class="close" on:click={toggleShowMainMenu}>&times;</div>
    <button
        on:click={() => {
            selectedTab = "settings";
        }}>Settings</button
    >
    <button
        on:click={() => {
            selectedTab = "entities";
        }}>Entities</button
    >
    {#if selectedTab === "settings"}
        <Settings />
    {:else if selectedTab === "entities"}
        <EntityList />
    {/if}
</div>

<style>
    .close {
        position: absolute;
        top: 5px;
        right: 5px;
        border: 1px solid green;
        width: 10px;
        cursor: pointer;
    }
    .container {
        overflow: scroll;
        width: 30%;
        background-color: black;
        border: 1px solid red;
        height: 100%;
        z-index: 2;
        position: absolute;
        top: 0;
        left: 0;
    }
</style>
