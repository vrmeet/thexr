<script>
    import Component from "./Component.svelte";
    export let toggleEntityList;
    let entities = window.serializedSpace.entities;
    let currentEntity = null;
    let currentComponent = null;

    $: isHighlighted = (component) => {
        console.log("isHighlighted is called");
        if (currentComponent) {
            return currentComponent.type == component.type;
        }
        return false;
    };
    // callbacks
    const highlightEntity = (entity) => {
        currentEntity = entity;
        currentComponent = null;
    };

    const highlightComponent = (component) => {
        console.log("highlight component", JSON.stringify(component));
        currentComponent = component;
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
                    highlightEntity(entity);
                }}
            >
                {entity.name}
            </li>
        {/each}
    </ul>
    <hr />
    {#if currentEntity}
        {#each currentEntity.components as component}
            <Component
                entity={currentEntity}
                {component}
                {highlightComponent}
                highlighted={isHighlighted(component)}
            />
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
