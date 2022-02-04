<script lang="ts">
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import MenuOverlay from "./components/MenuOverlay.svelte";
    import type { WebRTCClient } from "./web-rtc-client";
    import { signalHub } from "./signalHub";
    const MIC_CONFIRMED = "micConfirmed";

    //props
    export let canvasId: string;
    export let webRTCClient: WebRTCClient;
    // message bus with orchestrator

    //state
    let didJoinSpace = false;
    let showMicAndOutputForm = false;
    let showMenuOverlay = false;

    const micConfirmed = () => {
        const micSettingsString = window.sessionStorage.getItem(MIC_CONFIRMED);
        if (micSettingsString === null) {
            return false;
        } else {
            const micSettings = JSON.parse(micSettingsString);
            const constraints = {
                audio: { deviceId: { exact: micSettings.micDeviceId } },
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
        window.sessionStorage.setItem(
            MIC_CONFIRMED,
            JSON.stringify({ micDeviceId, outputDeviceId })
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
