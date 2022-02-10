<script lang="ts">
    import { getContext } from "svelte";
    import Component from "./Component.svelte";
    import { signalHub } from "../signalHub";
    import { query, mutation } from "@urql/svelte";
    export let entity;
    export let selected: boolean;
    export let highlightEntity;

    let currentComponent = null;
    const slug = getContext("slug");
    const deleteEntityMutation = mutation({
        query: `
      mutation ( $name: String!) {
        deleteEntity (slug: "${slug}", name: $name) 
      }
    `,
    });

    const highlightComponent = (component) => {
        console.log("highlight component", JSON.stringify(component));
        currentComponent = component;
    };

    const requestDeleteEntity = (entity) => {
        deleteEntityMutation({ name: entity.name });

        // signalHub.next({
        //     event: "spaces_api",
        //     payload: {
        //         func: "delete_entity_with_broadcast",
        //         args: [entity.id],
        //     },
        // });
    };

    $: isHighlighted = (component) => {
        console.log("isHighlighted is called");
        if (currentComponent) {
            return currentComponent.type == component.type;
        }
        return false;
    };
</script>

<li class:selected>
    <span class="entityName" on:click={highlightEntity(entity)}
        >{entity.name}</span
    >
    <span
        class="deleteEntity"
        on:click={() => {
            requestDeleteEntity(entity);
        }}>&times;</span
    >

    {#if selected}
        <ul>
            {#each entity.components as component}
                <Component
                    {entity}
                    {component}
                    {highlightComponent}
                    highlighted={isHighlighted(component)}
                />
            {/each}
        </ul>
    {/if}
</li>

<style>
    .deleteEntity {
        cursor: pointer;
    }
    .entityName {
        cursor: pointer;
    }
    .selected .entityName {
        font-weight: bold;
        color: red;
    }
</style>
