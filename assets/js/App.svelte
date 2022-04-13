<script lang="ts">
    import { setContext } from "svelte";
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import { signalHub } from "./signalHub";
    import { sessionPersistance } from "./sessionPersistance";
    import { initClient, operationStore, query } from "@urql/svelte";

    initClient({
        url: "/api",
        requestPolicy: "cache-and-network",
    });

    //props
    export let canvasId: string;
    export let space_id: string;

    setContext("space_id", space_id);
    // message bus with orchestrator

    //state
    let didInteract = false;
    let showMicAndOutputForm = false;

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
    const enterCallback = () => {
        signalHub.local.emit("interaction_choice", "enter");
        // signalHub.local.next(new EventJoined());
        didInteract = true;
        if (!micConfirmed()) {
            showMicAndOutputForm = true;
        } else {
            ready();
        }
    };

    const observeCallback = () => {
        signalHub.local.emit("interaction_choice", "observe");
        // signalHub.local.next(new EventJoined());
        didInteract = true;
        ready();
    };

    const ready = () => {
        let canvas = document.getElementById(canvasId);
        canvas.focus();
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

{#if !didInteract}
    <Welcome {enterCallback} {observeCallback} />
{/if}
{#if showMicAndOutputForm}
    <MicAndOutput {confirmMicAndOutputCallback} />
{/if}
