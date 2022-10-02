<script lang="ts">
    import { setContext } from "svelte";
    import {  afterUpdate } from 'svelte';
    import MenuHome from "./MenuHome.svelte";
    import type { Context } from "../context";

    //props

    export let context: Context
    export let updateCallback: () => void

    setContext("context", context)

    let muted = true;
    let menu_opened = false;
    const toggleMic = () => {
      muted = !muted
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

<div id="menu_bar" data-width="0.3">
    <button id="toggle_mute" on:click={toggleMic}>{micLabel}</button>
    <button id="toggle_menu_home" on:click={toggleMenu}>{menuLabel}</button>
</div>
{#if menu_opened}
<MenuHome/>
{/if}

<style>
    #menu_bar {
       position: absolute;
    }

   


</style>