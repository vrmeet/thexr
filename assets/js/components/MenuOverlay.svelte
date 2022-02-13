<script lang="ts">
    import type { WebRTCClient } from "../web-rtc-client";
    import MainEditMenu from "./MainEditMenu.svelte";
    import { signalHub } from "../signalHub";
    export let webRTCClient: WebRTCClient;

    // state
    let micState = webRTCClient.audioIsPublished ? "Unmuted" : "Muted";
    let showMainMenu = false;

    // callbacks
    const toggle = async () => {
        if (micState === "Muted") {
            micState = "...";
            await webRTCClient.publishAudio();
            micState = "Unmuted";
        } else if (micState === "Unmuted") {
            micState = "...";
            webRTCClient.unpublishAudio();
            micState = "Muted";
        }
    };

    const toggleShowMainMenu = () => {
        showMainMenu = !showMainMenu;
        signalHub.next({ event: "open_menu", payload: { target: "main" } });
    };
</script>

<div class="overlay">
    <div on:click={toggleShowMainMenu}>Menu</div>
    <div on:click={toggle}>{micState}</div>
</div>

<style>
    .overlay {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 2;
        cursor: pointer;
    }
</style>
