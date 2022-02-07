<script lang="ts">
    // see reference: https://webrtc.github.io/samples/src/content/devices/input-output/

    // props
    export let confirmMicAndOutputCallback;

    // state
    console.log("mic and output");
    let mics: MediaDeviceInfo[] = [];
    let outputs: MediaDeviceInfo[] = [];
    let selectedMic = null;
    let selectedOutput = null;

    const populateLists = (devices: MediaDeviceInfo[]) => {
        mics = [...devices.filter((device) => device.kind === "audioinput")];
        outputs = [
            ...devices.filter((device) => device.kind === "audiooutput"),
        ];
    };

    // load initial devices
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                console.log(devices);
                populateLists(devices);
                selectedMic = mics[0].deviceId;
                selectedOutput = outputs[0].deviceId;
            })
            .catch((reason) => {
                console.log("error", reason);
            });
    });

    //callbacks
    const selectMic = (mic: MediaDeviceInfo) => {
        selectedMic = mic.deviceId;
        const constraints = {
            audio: { deviceId: { exact: selectedMic } },
        };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            console.log("stream", stream);
            navigator.mediaDevices.enumerateDevices().then(populateLists);
        });
    };

    const selectOutput = (output: MediaDeviceInfo) => {
        selectedOutput = output.deviceId;
    };
</script>

<div class="modal">
    <div class="modal-content">
        <h2>Mic</h2>
        <ul>
            {#each mics as mic}
                <li
                    class:selected={mic.deviceId === selectedMic}
                    on:click={() => selectMic(mic)}
                >
                    {mic.label}
                </li>
            {/each}
        </ul>
        <h2>Output</h2>
        <ul>
            {#each outputs as output}
                <li
                    class:selected={output.deviceId === selectedOutput}
                    on:click={() => selectOutput(output)}
                >
                    {output.label}
                </li>
            {/each}
        </ul>

        <button
            on:click={() => {
                confirmMicAndOutputCallback(selectedMic, selectedOutput);
            }}>Confirm</button
        >
    </div>
</div>

<style>
    .selected {
        font-weight: 400;
        color: red;
    }

    li.selected:hover {
        color: red;
    }

    li {
        cursor: pointer;
    }
    li:hover {
        color: pink;
    }
</style>
