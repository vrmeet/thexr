<script lang="ts">
    import type { WebRTCClient } from "../web-rtc-client";
    import EntityList from "./EntityList.svelte";
    export let webRTCClient: WebRTCClient;

    // state
    let micState = webRTCClient.audioIsPublished ? "Unmuted" : "Muted";
    let showEntityList = false;

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

    const toggleEntityList = () => {
        showEntityList = !showEntityList;
    };
</script>

<div class="overlay">
    <div on:click={toggleEntityList}>Menu</div>
    <div on:click={toggle}>{micState}</div>
</div>

{#if showEntityList}
    <EntityList {toggleEntityList} />
{/if}

<style>
    .overlay {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 2;
        cursor: pointer;
    }
</style>
