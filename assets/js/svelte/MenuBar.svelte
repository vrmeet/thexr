<script lang="ts">
  import { setContext } from "svelte";
  import { afterUpdate } from "svelte";
  import MenuHome from "./MenuHome.svelte";
  import type { Context } from "../context";
  import {
    BAR_HEIGHT,
    BAR_WIDTH,
    SystemMenu,
  } from "../ecs/builtin_systems/system-menu";
  //props

  export let context: Context;

  setContext("context", context);
  const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;
  $: muted = context.my_mic_muted;
  $: menu_opened = context.menu_opened;
  $: logs_opened = context.logs_opened;
  $: micLabel = muted ? "Muted" : "Unmuted";
  $: menuLabel = menu_opened ? "Close Menu Ξ" : "Open Menu Ξ";
  $: logsLabel = logs_opened ? "Hide Logs" : "Show Logs";

  const toggleMic = () => {
    context.my_mic_muted = !context.my_mic_muted;
    context.signalHub.outgoing.emit("components_upserted", {
      id: context.my_member_id,
      components: {
        attendance: { mic_muted: context.my_mic_muted },
      },
    });
  };

  const toggleMenu = () => {
    context.menu_opened = !context.menu_opened;
  };

  const toggleLogs = () => {
    context.logs_opened = !context.logs_opened;
    if (context.logs_opened) {
      context.signalHub.local.emit("menu_event", "logger_opened");
    } else {
      context.signalHub.local.emit("menu_event", "logger_closed");
    }
  };

  afterUpdate(() => {
    systemMenu.renderMenuToTexture();
  });
</script>

<div id="menu_bar" style="width: {BAR_WIDTH}px; height: {BAR_HEIGHT}px;">
  <button id="toggle_mute" on:click={toggleMic}>{micLabel}</button>
  <button id="toggle_menu_home" on:click={toggleMenu}>{menuLabel}</button>
  <button id="toggle_logs" on:click={toggleLogs}>{logsLabel}</button>
  <button
    id="exit_btn"
    on:click={() => {
      window.location.href = "/";
    }}>Exit</button
  >
</div>
{#if menu_opened}
  <MenuHome {toggleMenu} />
{/if}

<style>
  #menu_bar {
    /* display: none; */
    position: absolute;
    border: 1px solid red;
    /* right: -500px; flash of content, off screen */
  }
  #menu_bar button {
    padding: 0 1em;
    margin: 0;
    width: 100%;
    font-size: 25px;
    height: 25%;
  }
</style>
