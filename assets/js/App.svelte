<script lang="ts">
    import { setContext } from "svelte";
    import Welcome from "./svelte-components/Welcome.svelte";
    import MicAndOutput from "./svelte-components/MicAndOutput.svelte";
    import AvatarAndNickName from "./svelte-components/AvatarAndNickname.svelte";
    import * as sessionPersistance from "./sessionPersistance";
    import { initClient } from "@urql/svelte";
    import { isMobileVR } from "./utils/utils-browser";
    import type { SignalHub } from "./signalHub";

    initClient({
        url: "/api",
        requestPolicy: "cache-and-network",
    });

    //props
    export let space_id: string;
    export let member_id: string;
    export let signalHub: SignalHub

    let choice: "enter" | "observe";

    setContext("space_id", space_id);
    setContext("member_id", member_id);
    setContext("signalHub", signalHub);

    //state
    let didInteract = false;
    let showAvatarAndNickNameForm = false;
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
    const avatarAndNicknameCallback = (nickname: string) => {
        sessionPersistance.saveNickname({ nickname });
        // orchestrator.memberStates.update_my_nickname(nickname);
        signalHub.menu.emit("update_nickname", nickname);
        showAvatarAndNickNameForm = false;
        if (isMobileVR()) {
            // no need to check mic and speaker, there is only one option
            return ready();
        }
        if (!micConfirmed()) {
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
        if (isMobileVR()) {
            // force authorize audio if first time
            navigator.mediaDevices.getUserMedia({ audio: true });
        }
    };

    const observeCallback = () => {
        choice = "observe";
        // signalHub.local.next(new EventJoined());
        didInteract = true;
        ready();
    };

    const ready = () => {
        signalHub.local.emit("client_ready", choice);
        let canvas = document.getElementById(space_id);
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
