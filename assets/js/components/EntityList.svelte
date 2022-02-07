<script>
    import Component from "./Component.svelte";
    import Entity from "./Entity.svelte";
    import AddEntity from "./AddEntity.svelte";
    import { signalHub } from "../signalHub";
    import { filter } from "rxjs/operators";
    export let toggleEntityList;
    let entities = window.serializedSpace.entities;
    let currentEntity = null;

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

    // callbacks
    const highlightEntity = (entity) => {
        console.log("high lighting entity", entity);
        currentEntity = entity;
    };
</script>

<div class="container">
    <div class="close" on:click={toggleEntityList}>&times;</div>

    <AddEntity />

    <h2>Entity List</h2>
    <ul>
        {#each entities as entity}
            <Entity
                {entity}
                {highlightEntity}
                selected={currentEntity && currentEntity.id == entity.id}
            />
        {/each}
    </ul>
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
