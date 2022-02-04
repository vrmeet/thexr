<script>
    export let toggleEntityList;
    let entities = window.serializedSpace.entities;
    let currentEntity = null;
    // callbacks
    const highlight = (entity) => {
        currentEntity = entity;
    };
</script>

<div class="container">
    <div class="close" on:click={toggleEntityList}>&times;</div>

    <h2>Entity List</h2>
    <ul>
        {#each entities as entity}
            <li
                on:click={() => {
                    console.log(entity);
                    highlight(entity);
                }}
            >
                {entity.name}
            </li>
        {/each}
    </ul>
    <hr />
    {#if currentEntity}
        {#each currentEntity.components as component}
            <div>{component.type}</div>
            <div>{component.data}</div>
        {/each}
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
