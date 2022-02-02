<script lang="ts">
    import Welcome from "./components/Welcome.svelte";
    import type { Subject } from "rxjs";
    import type { SignalEvent } from "./types";

    //props
    export let canvasId;
    // message bus with orchestrator
    export let signals: Subject<SignalEvent>;

    // action to take when someone has clicked the join space button
    const joined = () => {
        let canvas = document.getElementById(canvasId);
        canvas.focus();
        signals.next({ event: "joined", payload: {} });
    };

    const joinedCallback = () => {
        console.log("i called the join callback");
    };
</script>

<Welcome on:joined={joined} {joinedCallback} />
