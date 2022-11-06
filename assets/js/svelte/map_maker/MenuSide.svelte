<script lang="ts">
    import { share } from "rxjs";
    import { getContext } from "svelte";
    import type { MapView } from "../../mapbuilder/mapview";
    const shared: { mapview: MapView } = getContext("shared");
    const enablePan = () => {
        shared.mapview.enablePan();
    };
</script>

<div id="menu">
    <button on:click={enablePan}>Pan</button>
</div>

<style>
    #menu {
        position: absolute;
        width: 40%;
        height: 100%;
        border: 1px solid red;
        right: 0;
        top: 0;
    }
</style>
