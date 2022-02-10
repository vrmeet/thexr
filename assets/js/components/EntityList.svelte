<script>
    import { getContext } from "svelte";
    import { query, operationStore } from "@urql/svelte";
    import Entity from "./Entity.svelte";
    import AddEntity from "./AddEntity.svelte";
    import Settings from "./Settings.svelte";
    import { signalHub } from "../signalHub";
    import { filter } from "rxjs/operators";

    let entities = [];

    const slug = getContext("slug");

    // onMount(async () => {
    console.log("in on mount");
    const space = operationStore(`
query {
  space(slug: "${slug}") {
    id
    entities {
        id
        name
        type
        components {
            type
            data
        }
    }
  }
}
`);

    query(space);
    space.subscribe((value) => {
        if (value.data) {
            entities = value.data.space.entities;
        }
    });

    // let entities = window.serializedSpace.entities;
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
    {#if $space.fetching}
        <p>Loading...</p>
    {:else if $space.error}
        <p>Oh no... {$space.error.message}</p>
    {:else}
        <h2>Entities</h2>
        <ul>
            {#each entities as entity}
                <Entity
                    {entity}
                    {highlightEntity}
                    selected={currentEntity && currentEntity.id == entity.id}
                />
            {/each}
        </ul>
        <AddEntity />
    {/if}
</div>
