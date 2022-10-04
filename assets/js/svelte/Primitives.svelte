<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import { cameraFrontPosition, random_id } from "../utils/misc";

  let context: Context = getContext("context");
  let createBox = () => {
     context.signalHub.outgoing.emit("entity_created", {
       id: `box_${random_id(5)}`,
       components: {
           shape: { prim: "box", prim_params: {}},
           position: cameraFrontPosition(context.scene, 2)
       }
     }) 
   }
  let createSphere = () => {
       context.signalHub.outgoing.emit("entity_created", {
       id: `sphere_${random_id(5)}`,
       components: {
           shape: { prim: "sphere", prim_params: {}},
           position: cameraFrontPosition(context.scene, 2)
       }
     }) 
  }
</script>

  <button on:click={createBox}>Box</button>
  <button on:click={createSphere}>Sphere</button>

