<script lang="ts">
    import MenuSide from "./MenuSide.svelte";
    import MapSide from "./MapSide.svelte";
    import { setContext } from "svelte";
    import type { MapView } from "../../mapbuilder/mapview";
    const shared: { mapview: MapView } = { mapview: null };
    setContext("shared", shared);
</script>

<div id="container">
    <MapSide />
    <MenuSide />
</div>

<style>
    #container {
        overflow: hidden;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;

        background: radial-gradient(ellipse at top, #201111, transparent),
            radial-gradient(ellipse at bottom, #000021, transparent);
        position: absolute;
    }
</style>
