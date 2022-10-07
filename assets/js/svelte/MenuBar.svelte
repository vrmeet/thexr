<script lang="ts">
    import { setContext } from "svelte";
    import { afterUpdate } from 'svelte';
    import MenuHome from "./MenuHome.svelte";
    import type { Context } from "../context";

    //props

    export let context: Context
    export let updateCallback: () => void

    setContext("context", context)
    setContext("updateCallback", updateCallback)

    $: muted = context.my_mic_muted
    let menu_opened = false;
    const toggleMic = () => {
      context.my_mic_muted = !context.my_mic_muted
      context.signalHub.outgoing.emit("components_upserted", {
        id: context.my_member_id,
        components: {
            mic_muted: context.my_mic_muted
        }
      })
    }
    $: micLabel = (muted) ? "Muted" : "Unmuted";
    const toggleMenu = () => {
        menu_opened = !menu_opened
    }
    $: menuLabel = (menu_opened) ? "Close Menu" : "Open Menu"


    afterUpdate(()=>{
        updateCallback()
    })
</script>

<div id="menu_bar">
    <button id="toggle_mute" on:click={toggleMic}>{micLabel}</button>
    <button id="toggle_menu_home" on:click={toggleMenu}>{menuLabel}</button>
    <button>[Health]</button>
    <button>Exit</button>
</div>
{#if menu_opened}
<MenuHome/>
{/if}

<style>
    #menu_bar {
       position: absolute;
       width: 256px;
       height: 256px;
       border: 1px solid red;
     
       right: 0

    }
    #menu_bar button {
       padding: 0 1em;
       margin: 0;
       width: 100%;
       font-size: 25px;
       height: 25%;
    }

   


</style>