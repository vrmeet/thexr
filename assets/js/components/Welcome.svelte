<script lang="ts">
    export let joinedCallback;
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    let showJoinModal = true;
    let showMicForm = false;

    const joinButtonClicked = () => {
        // bubbles up this message to parent component
        dispatch("joined");
        showJoinModal = false;
        if (!micOptionsSet()) {
            showMicForm = true;
        }
    };

    const micOptionsSet = () => {
        let options = window.sessionStorage.getItem("micOptions");
        return options;
    };
</script>

{#if showJoinModal}
    <div class="modal">
        <div class="modal-content">
            <h2>Welcome</h2>

            <button on:click={joinedCallback}>Join Space</button>
        </div>
    </div>
{/if}

<style>
    .modal {
        /* display: none;*/ /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 2; /* Sit on top */
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
    .modal-content {
        background-color: #fefefe;
        margin: auto;
        padding: 20px;
        border: 1px solid #888;
        width: 50%;
    }

    /* div {
        width: 100%;
        height: 100%;
        text-align: center;
        position: absolute;
        top: 0;
        z-index: 10;
        border: 5px solid black;
    } */
</style>
