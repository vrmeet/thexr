<script lang="ts">
  import { getContext } from "svelte";
  import type { Context } from "../context";
  import { cameraFrontPosition, random_id } from "../utils/misc";
  import Select from "./Select.svelte";
  import Import from "./Import.svelte";

  let context: Context = getContext("context");
  let setSelected: (any) => () => void = getContext("setSelected");

  let createPrim = (prim) => {
    return () => {
      const meshName = `${prim}_${random_id(5)}`;
      context.signalHub.outgoing.emit("entity_created", {
        id: meshName,
        components: {
          shape: { prim: prim, prim_params: {} },
          transform: { position: cameraFrontPosition(context.scene, 2) },
        },
      });
      setSelected(Select)();
      setTimeout(() => {
        context.signalHub.local.emit(
          "mesh_picked",
          context.scene.getMeshByName(meshName)
        );
      }, 100);
    };
  };
  let createCone = () => {
    const meshName = `cone_${random_id(5)}`;
    context.signalHub.outgoing.emit("entity_created", {
      id: meshName,
      components: {
        shape: { prim: "cylinder", prim_params: { diameterTop: 0 } },
        transform: { position: cameraFrontPosition(context.scene, 2) },
      },
    });
    setSelected(Select)();
    setTimeout(() => {
      context.signalHub.local.emit(
        "mesh_picked",
        context.scene.getMeshByName(meshName)
      );
    }, 100);
  };
</script>

<button id="back" on:click={setSelected(Select)}>‹ Back</button>
<div id="primitive_choices">
  <button id="box" on:click={createPrim("box")}>Box</button>
  <button id="sphere" on:click={createPrim("sphere")}>Sphere</button>
  <button id="cone" on:click={createCone}>Cone</button>
  <button id="cylinder" on:click={createPrim("cylinder")}>Cylinder</button>
  <button id="plane" on:click={createPrim("plane")}>Plane</button>
  <button id="capsule" on:click={createPrim("capsule")}>Capsule</button>
</div>
<div id="construct_choices">
  <button id="goto_import_mesh" on:click={setSelected(Import)}
    >Import Mesh</button
  >
</div>

<style>
  #back {
    background-color: transparent;
    padding: 0;
  }
  #primitive_choices {
    border: 1px solid white;
    width: 100%;
    position: relative;
  }
  #construct_choices {
    border: 1px solid white;
    width: 100%;
    position: relative;
  }
</style>
