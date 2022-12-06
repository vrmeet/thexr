<script lang="ts">
    import { getContext } from "svelte";
    import { query, operationStore } from "@urql/svelte";

    //props
    export let enterCallback;
    export let observeCallback;
    let name;
    let description;

    const space_id = getContext("space_id");

    // onMount(async () => {

    //     const space = operationStore(`
    // query {
    //   space(space_id: "${space_id}") {
    //     name
    //     description
    //   }
    // }
    // `);

    // query(space);
    // space.subscribe((value) => {
    //     
    //     if (value.data) {
    //         name = value.data.space.name;
    //         description = value.data.space.description;
    //     }
    // });
</script>

<!-- {#if $space.fetching}
    <p>Loading...</p>
{:else if $space.error}
    <p>Oh no... {$space.error.message}</p>
{:else} -->
<div class="modal">
    <div class="modal-content">
        <!-- <h2>Welcome to {$space.data.space.name}</h2> -->
        <!-- {#if $space.data.space.description}
                <p>
                    {$space.data.space.description}
                </p>
            {/if} -->
        <button on:click={enterCallback}>Enter</button>
        <button on:click={observeCallback}>Observe</button>
    </div>
</div>

<!-- {/if} -->
<style>
    :global(.modal) {
        /* display: none;*/ /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 12; /* Sit on top */
        padding-top: 100px; /* Location of the box */
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgb(0, 0, 0); /* Fallback color */
        background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
        user-select: none;
    }

    /* Modal Content */
    :global(.modal-content) {
        background-color: #fefefe;
        margin: auto;
        padding: 20px;
        border: 1px solid #888;
        width: 50%;
    }
</style>
