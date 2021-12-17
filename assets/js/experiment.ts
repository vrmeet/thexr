import * as BABYLON from 'babylonjs'

let workerCode = `

onmessage = (msg) => {
    if (msg.data[0] === "add") {
        console.log('cookie', document.cookie)
       
        self.postMessage(["result", msg.data[1] + msg.data[2]])
        
    }
}
`

let workerBlob = new Blob([workerCode], { type: "text/javascript" })

let workerURL = URL.createObjectURL(workerBlob)

let worker = new Worker(workerURL)


worker.postMessage(["add", 1, 2])
worker.onmessage = (incoming) => {
    console.log("incoming from worker", incoming.data)
}
window["worker"] = worker
// window["plugins"] = {}
// //load plugins
// Tools.LoadScript("http://localhost:4000/assets/plugin1.js", () => {
//     console.log("plugin1 was loaded")

//     Tools.LoadScript("http://localhost:4000/assets/plugin2.js", () => {
//         console.log("plugin2 was loaded")
//     }, () => { }, "hi2")
// }, () => { }, "hi")

window.addEventListener('DOMContentLoaded', async function () {
    console.log('window bABYLON', window["BABYLON"])
    var canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

    let engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    var createScene = function () {
        // Create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
        // Target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);
        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 1;
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
        // Return the created scene
        return scene;
    }
    // call the createScene function
    var scene = createScene();
    // run the render loop
    engine.runRenderLoop(function () {
        scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener('resize', function () {
        engine.resize();
    });
})
