<script lang="ts">
    import { getContext } from "svelte";
    import { sessionPersistance } from "../sessionPersistance";
    export let avatarAndNicknameCallback;

    let member_id: string = getContext("member_id");

    let nickname: string =
        sessionPersistance.getNickname()?.nickname || member_id;
</script>

<div class="modal">
    <div class="modal-content">
        <h2>Nickname and Avatar</h2>
        <input type="text" placeholder="Your Nickname" bind:value={nickname} />
        <button on:click={avatarAndNicknameCallback(nickname)}>Confirm</button>
    </div>
</div>
