<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    export let avatarAndNicknameCallback;

    let context: Context = getContext("context");
    let nickname: string = context.my_nickname;
</script>

<div class="modal">
    <div class="modal-content">
        <h2>Nickname and Avatar</h2>
        <input type="text" placeholder="Your Nickname" bind:value={nickname} />
        <button on:click={avatarAndNicknameCallback(nickname)}>Confirm</button>
    </div>
</div>
