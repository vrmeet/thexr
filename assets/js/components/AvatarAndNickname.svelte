<script lang="ts">
    import { getContext } from "svelte";
    import type { Orchestrator } from "../orchestrator";
    export let avatarAndNicknameCallback;
    const orchestrator: Orchestrator = getContext("orchestrator");

    let nickname: string = orchestrator.member_id;
</script>

<div class="modal">
    <div class="modal-content">
        <h2>Nickname and Avatar</h2>
        <input type="text" placeholder="Your Nickname" bind:value={nickname} />
        <button on:click={avatarAndNicknameCallback(nickname)}>Confirm</button>
    </div>
</div>
