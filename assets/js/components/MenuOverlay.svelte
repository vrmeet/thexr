<script lang="ts">
    import type { WebRTCClient } from "../web-rtc-client";
    export let webRTCClient: WebRTCClient;

    let micState = webRTCClient.audioIsPublished ? "Unmuted" : "Muted";

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
</script>

<div class="overlay">
    <div>Menu</div>
    <div on:click={toggle}>{micState}</div>
</div>

<style>
    .overlay {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 3;
        cursor: pointer;
    }
</style>
