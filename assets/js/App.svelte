<script lang="ts">
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import MenuOverlay from "./components/MenuOverlay.svelte";
    import type { Subject } from "rxjs";
    import type { SignalEvent } from "./types";
    import type { WebRTCClient } from "./web-rtc-client";

    //props
    export let canvasId: string;
    export let webRTCClient: WebRTCClient;
    // message bus with orchestrator
    export let signals: Subject<SignalEvent>;

    //state
    let didJoinSpace = false;
    let showMicAndOutputForm = false;
    let showMenuOverlay = false;
    let micNotConfirmed = true;

    //callbacks
    const joinedCallback = () => {
        console.log("i called the join callback");

        signals.next({ event: "joined", payload: {} });
        didJoinSpace = true;
        if (micNotConfirmed) {
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
