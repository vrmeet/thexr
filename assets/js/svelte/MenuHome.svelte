<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import Attendees from "./Attendees.svelte";
  import Primitives from "./Primitives.svelte";
  import Select from "./Select.svelte";
  import Sculpt from "./Sculpt.svelte";
  import { afterUpdate } from "svelte";
  import {
    HOME_HEIGHT,
    HOME_WIDTH,
    SystemMenu,
  } from "../ecs/builtin_systems/system-menu";

  let context: Context = getContext("context");
  const systemMenu: SystemMenu = context.systems["menu"] as SystemMenu;
  let selected;
  const setSelected = (component) => {
    return () => {
      selected = component;
    };
  };

  afterUpdate(() => {
    systemMenu.renderMenuToTexture();
  });
</script>

<div id="menu_home" style="width: {HOME_WIDTH}px; height: {HOME_HEIGHT}px;">
  <div id="menu_left">
    <button
      class:selected={selected == Attendees}
      on:click={setSelected(Attendees)}>Attendees</button
    >
    <button
      class:selected={selected == Primitives}
      on:click={setSelected(Primitives)}>Primitives</button
    >
    <button class:selected={selected == Select} on:click={setSelected(Select)}
      >Select</button
    >
    <button class:selected={selected == Sculpt} on:click={setSelected(Sculpt)}
      >Sculpt</button
    >
  </div>
  <div id="menu_right">
    <svelte:component this={selected} />
  </div>
</div>

<style>
  #menu_home {
    border: 1px solid blue;
    position: absolute;
    /* top: 100px;
    right: 100px; */
    right: -500px; /* flash of content, off screen */
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
  }
</style>
