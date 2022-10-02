<script lang="ts">
    import { getContext } from "svelte";
    import type { Context } from "../context";
    import * as sessionPersistance from "../sessionPersistance";
    export let avatarAndNicknameCallback;

    let context: Context = getContext("context");
    let my_member_id: string = context.my_member_id
    let nickname: string =
        sessionPersistance.getNickname()?.nickname || my_member_id;
</script>

<div class="modal">
    <div class="modal-content">
        <h2>Nickname and Avatar</h2>
        <input type="text" placeholder="Your Nickname" bind:value={nickname} />
        <button on:click={avatarAndNicknameCallback(nickname)}>Confirm</button>
    </div>
</div>
