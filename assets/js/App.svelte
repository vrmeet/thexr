<script lang="ts">
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import MenuOverlay from "./components/MenuOverlay.svelte";
    import type { WebRTCClient } from "./web-rtc-client";
    import { signalHub } from "./signalHub";
    import { sessionPersistance } from "./sessionPersistance";
    import { initClient, operationStore, query } from "@urql/svelte";

    initClient({
        url: "/api",
    });

    const todos = operationStore(`
query {
  spaces {
    id
  }
}
`);

    query(todos);
    todos.subscribe((value) => {
        console.log("value", value);
    });

    //props
    export let canvasId: string;
    export let webRTCClient: WebRTCClient;
    // message bus with orchestrator

    //state
    let didJoinSpace = false;
    let showMicAndOutputForm = false;
    let showMenuOverlay = false;

    const micConfirmed = () => {
        const micChoice = sessionPersistance.getMicAndOutputChoice();
        if (micChoice === null) {
            return false;
        } else {
            const constraints = {
                audio: { deviceId: { exact: micChoice.micDeviceId } },
            };
            navigator.mediaDevices.getUserMedia(constraints);

            return true;
        }
    };

    //callbacks
    const joinedCallback = () => {
        console.log("i called the join callback");

        signalHub.next({ event: "joined", payload: {} });
        didJoinSpace = true;
        if (!micConfirmed()) {
            showMicAndOutputForm = true;
        } else {
            ready();
        }
    };

    const ready = () => {
        let canvas = document.getElementById(canvasId);
        canvas.focus();
        showMenuOverlay = true;
    };

    const confirmMicAndOutputCallback = (
        micDeviceId: string,
        outputDeviceId: string
    ) => {
        console.log(
            "you confirmed mic",
            micDeviceId,
            "and output",
            outputDeviceId
        );
        sessionPersistance.saveMicAndOutputChoice({
            micDeviceId,
            outputDeviceId,
        });
        showMicAndOutputForm = false;
        ready();
    };
</script>

{#if $todos.fetching}
    <p>Loading...</p>
{:else if $todos.error}
    <p>Oh no... {$todos.error.message}</p>
{:else}
    <ul>
        {#each $todos.data.spaces as space}
            <li>{space.id}</li>
        {/each}
    </ul>
{/if}

{#if !didJoinSpace}
    <Welcome {joinedCallback} />
{/if}
{#if showMicAndOutputForm}
    <MicAndOutput {confirmMicAndOutputCallback} />
{/if}
{#if showMenuOverlay}
    <MenuOverlay {webRTCClient} />
{/if}
