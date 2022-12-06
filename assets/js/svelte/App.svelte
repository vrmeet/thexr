<script lang="ts">
    import { setContext } from "svelte";
    import Welcome from "./Welcome.svelte";
    import MicAndOutput from "./MicAndOutput.svelte";
    import AvatarAndNickName from "./AvatarAndNickname.svelte";
    import * as sessionPersistance from "../sessionPersistance";
    import { initClient } from "@urql/svelte";
    import { isMobileVR } from "../utils/utils-browser";
    import type { Context } from "../xrs-ecs/context";

    // initClient({
    //     url: "/api",
    //     requestPolicy: "cache-and-network",
    // });

    //props
    export let context: Context;

    let choice: "enter" | "observe";

    setContext("context", context);

    //state
    let didInteract = false;
    let showAvatarAndNickNameForm = false;
    let showMicAndOutputForm = false;

    const micConfirmed = async () => {
        const micChoice = sessionPersistance.getMicAndOutputChoice();
        
        if (micChoice === null) {
            return false;
        } else {
            const constraints = {
                audio: { deviceId: { exact: micChoice.micDeviceId } },
            };
            await navigator.mediaDevices.getUserMedia(constraints);

            return true;
        }
    };

    //callbacks
    const avatarAndNicknameCallback = async (nickname: string) => {
        context.my_nickname = nickname;
        sessionPersistance.saveNickname({ nickname });

        showAvatarAndNickNameForm = false;
        if (isMobileVR()) {
            // no need to check mic and speaker,
            // there is only one option on head mounted displays
            return ready();
        }
        if (!(await micConfirmed())) {
            
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
        context.signalHub.local.emit("client_ready", choice);
        let canvas = document.getElementById(context.space.id);
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
