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
    $: menu_opened = context.menu_opened;
    $: logs_opened = context.logs_opened;
    $: micLabel = (muted) ? "Muted" : "Unmuted";
    $: menuLabel = (menu_opened) ? "Close Menu" : "Open Menu"
    $: logsLabel = (logs_opened) ? "Hide Logs" : "Show Logs"

    const toggleMic = () => {
      context.my_mic_muted = !context.my_mic_muted
      context.signalHub.outgoing.emit("components_upserted", {
        id: context.my_member_id,
        components: {
            mic_muted: context.my_mic_muted
        }
      })
    }
    
    const toggleMenu = () => {
        context.menu_opened = !context.menu_opened
    }
    
    const toggleLogs = () => {
      context.logs_opened = !context.logs_opened
      if (context.logs_opened) {
        context.signalHub.local.emit("menu_event", "logger_opened")
      } else {
        context.signalHub.local.emit("menu_event", "logger_closed")
      }
    }


    afterUpdate(()=>{
        updateCallback()
    })
</script>

<div id="menu_bar">
    <button id="toggle_mute" on:click={toggleMic}>{micLabel}</button>
    <button id="toggle_menu_home" on:click={toggleMenu}>{menuLabel}</button>
    <button id="toggle_logs" on:click={toggleLogs}>{logsLabel}</button>
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