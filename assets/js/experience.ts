import * as BABYLON from 'babylonjs'
import { ExperienceSpecParser } from './experience_spec_parser'
window.addEventListener('DOMContentLoaded', async function () {
    var canvas = document.getElementById('spaceCanvas') as HTMLCanvasElement;

    let engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    var createScene = function () {
        // Create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);
        window['scene'] = scene
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
        // Target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);
        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

        return scene;
    }
    // call the createScene function
    var scene = createScene();
    // parse the scene for states
    let experienceParser = new ExperienceSpecParser('', scene)
    window['experienceParser'] = experienceParser
    experienceParser.stateChange('part1')
    // run the render loop
    engine.runRenderLoop(function () {
        scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener('resize', function () {
        engine.resize();
    });
})
