<script lang="ts">
    import { setContext } from "svelte";
    import Welcome from "./components/Welcome.svelte";
    import MicAndOutput from "./components/MicAndOutput.svelte";
    import AvatarAndNickName from "./components/AvatarAndNickname.svelte";
    import { signalHub } from "./signalHub";
    import { sessionPersistance } from "./sessionPersistance";
    import { initClient, operationStore, query } from "@urql/svelte";
    import type { Orchestrator } from "./orchestrator";

    initClient({
        url: "/api",
        requestPolicy: "cache-and-network",
    });

    //props
    export let orchestrator: Orchestrator;
    const canvasId = orchestrator.canvasId;
    const space_id = orchestrator.space_id;
    let choice: "enter" | "observe";

    setContext("orchestrator", orchestrator);
    setContext("space_id", space_id);
    // message bus with orchestrator

    //state
    let didInteract = false;
    let showAvatarAndNickNameForm = false;
    let showMicAndOutputForm = false;
    console.log(navigator.userAgent.toLowerCase());
    let isOculus =
        navigator.userAgent.toLowerCase().indexOf("oculus") > -1 ||
        navigator.userAgent.toLowerCase().indexOf("vr") > -1
            ? true
            : false;

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
    const avatarAndNicknameCallback = (nickname: string) => {
        sessionPersistance.saveNickname({ nickname });
        orchestrator.memberStates.update_my_nickname(nickname);
        showAvatarAndNickNameForm = false;
        if (!isOculus && !micConfirmed()) {
            showMicAndOutputForm = true;
        } else {
            ready();
        }
    };

    const enterCallback = () => {
        choice = "enter";
        // signalHub.local.next(new EventJoined());
        didInteract = true;
        showAvatarAndNickNameForm = true;
    };

    const observeCallback = () => {
        choice = "observe";
        // signalHub.local.next(new EventJoined());
        didInteract = true;
        ready();
    };

    const ready = () => {
        signalHub.local.emit("client_ready", choice);
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
{#if showAvatarAndNickNameForm}
    <AvatarAndNickName {avatarAndNicknameCallback} />
{/if}
{#if showMicAndOutputForm}
    <MicAndOutput {confirmMicAndOutputCallback} />
{/if}
