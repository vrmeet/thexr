<script lang="ts">
  import { getContext, setContext, onDestroy } from "svelte";
  import type { Context } from "../context";
  import Attendees from "./Attendees.svelte";
  import Primitives from "./Primitives.svelte";
  import Select from "./Select.svelte";
  import Export from "./Export.svelte";
  import { afterUpdate } from "svelte";
  import {
    HOME_HEIGHT,
    HOME_WIDTH,
    SystemMenu,
  } from "../ecs/builtin_systems/system-menu";

  export let toggleMenu: () => void;

  let context: Context = getContext("context");
  const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;
  let selected;
  let componentData;
  const setSelected = (component, data = {}) => {
    return () => {
      selected = component;
      componentData = data;
    };
  };
  // allow edit menu to call up primitives
  setContext("setSelected", setSelected);
  // setSelected(Export)();
  afterUpdate(() => {
    systemMenu.renderMenuToTexture();
  });
  onDestroy(() => {
    console.log("destroy menu home");
    systemMenu.tearDownVRMenu();
    systemMenu.tearDownFullScreenMenu();
  });
</script>

<div id="menu_home" style="width: {HOME_WIDTH}px; height: {HOME_HEIGHT}px;">
  <div id="menu_left">
    <button
      id="attendees_btn"
      class:selected={selected == Attendees}
      on:click={setSelected(Attendees)}>Attendees</button
    >

    <button
      id="edit_btn"
      class:selected={selected == Select || selected == Primitives}
      on:click={setSelected(Select)}>Edit</button
    >
  </div>
  <div id="menu_right">
    <svelte:component this={selected} data={componentData} />
  </div>
  <button id="close_menu" on:click={toggleMenu}>x</button>
</div>

<style>
  #close_menu {
    padding: 0;
    margin: 0;
    height: 2em;
    width: 2em;
    border: 1px solid red;
    position: absolute;
    right: 0;
    top: 0;
  }
  #menu_home {
    /* border: 1px solid white; */
    position: absolute;
    top: 100px;
    left: 700px;
    /* z-index: 22; */
    right: -500px;
    /* flash of content, off screen */
  }
  .selected {
    background-color: blue;
  }

  #menu_left {
    position: absolute;
    width: 20%;
    height: 100%;
    background-color: black;
  }

  #menu_left button {
    width: 100%;
    padding: 0;
  }

  #menu_right {
    width: 80%;
    height: 100%;
    position: absolute;
    background-color: brown;
    top: 0;
    right: 0;
    overflow: scroll;
  }
</style>
