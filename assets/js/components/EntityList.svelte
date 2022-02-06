<script>
    import Component from "./Component.svelte";
    import AddEntity from "./AddEntity.svelte";
    import { signalHub } from "../signalHub";
    import { filter } from "rxjs/operators";
    export let toggleEntityList;
    let entities = window.serializedSpace.entities;
    let currentEntity = null;
    let currentComponent = null;

    signalHub
        .pipe(filter((msg) => msg.event === "entity_created"))
        .subscribe((msg) => {
            entities = [...entities, msg.payload];
        });

    signalHub
        .pipe(filter((msg) => msg.event === "entity_deleted"))
        .subscribe((msg) => {
            entities = entities.filter((entity) => entity.id != msg.payload.id);
        });

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

    const requestDeleteEntity = (entity) => {
        signalHub.next({
            event: "spaces_api",
            payload: {
                func: "delete_entity_with_broadcast",
                args: [entity.id],
            },
        });
    };
</script>

<div class="container">
    <div class="close" on:click={toggleEntityList}>&times;</div>

    <AddEntity />

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
                <span
                    on:click={() => {
                        requestDeleteEntity(entity);
                    }}>&times;</span
                >
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
