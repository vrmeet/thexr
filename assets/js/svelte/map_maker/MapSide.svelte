<script lang="ts">
    import { onMount, getContext } from "svelte";
    import { MapView } from "../../mapbuilder/mapview";
    const shared: any = getContext("shared");
    onMount(() => {
        shared.mapview = new MapView("mapview");
    });
</script>

<canvas id="mapview" />

<style>
    #mapview {
        position: absolute;
        width: 60%;
        height: 100%;
    }
</style>
