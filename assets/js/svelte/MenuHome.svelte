<script lang="ts">
     import { getContext } from "svelte";
    import type { Context } from "../context";
    import Attendees from "./Attendees.svelte";
    import Primitives from "./Primitives.svelte";
    import { afterUpdate } from 'svelte';
    let updateCallback: () => void = getContext("updateCallback");

    let selected;
    const setSelected = (component) => {
      return () => {selected = component}
    }

    afterUpdate(()=>{
      updateCallback()
    })
    
</script>

<div id="menu_home">
  <div id="menu_left">
    <button on:click={setSelected(Attendees)}>Attendees</button>
    <button on:click={setSelected(Primitives)}>Primitives</button>
  </div>
  <div id="menu_right">
    <svelte:component this={selected}/>
  </div>
    
</div>

<style>
    #menu_home {
       border: 1px solid blue;
       position: absolute;
       top: 100px;
       right: 100px;
       width: 500px;
       height: 500px;
    }
    #menu_left {
        border: 1px solid red;
        width: 150px;
        height: 100%;
        background-color: blue;
    }
    #menu_left button {
        width: 100%;
    }
    #menu_right {
      border: 1px solid green;
      width: 350px;
      height: 500px;
      position: absolute;
      background-color: brown;
      top: 0;
      right: 0
    }

   


</style>