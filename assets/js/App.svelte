<script lang="ts">
    import { setContext } from "svelte";
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import MenuOverlay from "./components/MenuOverlay.svelte";
    import type { WebRTCClient } from "./web-rtc-client";
    import { signalHub } from "./signalHub";
    import { sessionPersistance } from "./sessionPersistance";
    import { initClient, operationStore, query } from "@urql/svelte";

    initClient({
        url: "/api",
        requestPolicy: "cache-and-network",
    });

    //props
    export let canvasId: string;
    export let webRTCClient: WebRTCClient;
    export let slug: string;

    setContext("slug", slug);
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
        sessionPersistance.saveMicAndOutputChoice({
            micDeviceId,
            outputDeviceId,
        });
        showMicAndOutputForm = false;
        ready();
    };
</script>

{#if !didJoinSpace}
    <Welcome {joinedCallback} />
{/if}
{#if showMicAndOutputForm}
    <MicAndOutput {confirmMicAndOutputCallback} />
{/if}
{#if showMenuOverlay}
    <MenuOverlay {webRTCClient} />
{/if}
