import {
  fromEvent,
  map,
  mergeMap,
  Observable,
  scan,
  takeUntil,
  tap,
} from "rxjs";
window.addEventListener("DOMContentLoaded", async () => {
  console.log("calling map maker1");

  const canvas = document.getElementById("mapMaker") as HTMLCanvasElement;

  const ratio = 20; // 20 meters left and right on horizontal

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.FreeCamera(
    "freeCam",
    new BABYLON.Vector3(0, 10, 0),
    scene
  );
  //   camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "HemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  camera.target = BABYLON.Vector3.Zero();

  //   camera.mode = BABYLON.FreeCamera.ORTHOGRAPHIC_CAMERA;
  //   camera.orthoTop = 0;
  //   camera.orthoLeft = 0;
  //   camera.orthoBottom = canvas.height;
  //   camera.orthoRight = canvas.width;

  function _setupCamera(
    camera: BABYLON.Camera,
    width: number,
    height: number
  ): void {
    // We chose an orthographic view to simplify at most our mesh creation
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    const horizontalRatio = width / ratio;
    // Setup the camera to fit with our gl coordinates in the canvas
    camera.unfreezeProjectionMatrix();
    camera.orthoTop = height / horizontalRatio;
    camera.orthoLeft = -ratio;
    camera.orthoBottom = -height / horizontalRatio;
    camera.orthoRight = ratio;
    camera.getProjectionMatrix(true);
    camera.freezeProjectionMatrix();
  }

  _setupCamera(camera, engine.getRenderWidth(), engine.getRenderHeight());

  const ground = BABYLON.MeshBuilder.CreateGround("ground", {
    height: 200,
    width: 250,
    subdivisions: 4,
  });

  const box = BABYLON.MeshBuilder.CreateBox("", {}, scene);

  const defaultGridMaterial = new BABYLON.GridMaterial("gridMat", scene);
  ground.material = defaultGridMaterial;

  engine.runRenderLoop(() => {
    scene.render();
  });
  // the canvas/window resize event handler
  window.addEventListener("resize", () => {
    console.log("resized");
    engine.resize();
    _setupCamera(camera, engine.getRenderWidth(), engine.getRenderHeight());
  });

  // create rxjs observable from babylon observable

  const mouseDown$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
    // wrap the babylonjs observable
    const babylonObserver = scene.onPointerObservable.add((data) => {
      if (data.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        subscriber.next(data);
      }
    });
    return () => {
      scene.onPointerObservable.remove(babylonObserver);
    };
  });

  const mouseMove$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
    // wrap the babylonjs observable
    const babylonObserver = scene.onPointerObservable.add((data) => {
      if (data.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        subscriber.next(data);
      }
    });
    return () => {
      scene.onPointerObservable.remove(babylonObserver);
    };
  });

  const mouseUp$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
    // wrap the babylonjs observable
    const babylonObserver = scene.onPointerObservable.add((data) => {
      if (data.type === BABYLON.PointerEventTypes.POINTERUP) {
        subscriber.next(data);
      }
    });
    return () => {
      scene.onPointerObservable.remove(babylonObserver);
    };
  });

  mouseDown$.subscribe((data) => {
    const point = data.pickInfo.pickedPoint;
    const box = BABYLON.MeshBuilder.CreateBox("", {}, scene);
    box.position = point;
  });

  // after mousedown, take position until mouse up
  mouseDown$
    .pipe(
      map((data) => ({
        mouseX: data.event.x,
        mouseY: data.event.y,
        camX: scene.activeCamera.position.x,
        camY: scene.activeCamera.position.z,
      })),
      mergeMap((data) => {
        return mouseMove$.pipe(
          map((e) => ({ cx: e.event.x, cy: e.event.y })),
          //   scan(
          //     (
          //       acc: { x: number; y: number; deltaX: number; deltaY: number },
          //       data: BABYLON.PointerInfo
          //     ) => {
          //       acc.deltaX = data.event.x - acc.x;
          //       acc.deltaY = acc.y - data.event.y;
          //       acc.x = data.event.x;
          //       acc.y = data.event.y;
          //       return acc;
          //     },
          //     data
          //   ),
          tap((v) => {
            const deltaX = v.cx - data.mouseX;
            const deltaY = data.mouseY - v.cy;

            scene.activeCamera.position.x = data.camX + deltaX / ratio;
            scene.activeCamera.position.z = data.camY + deltaY / ratio;
            console.log(
              scene.activeCamera.position.x,
              scene.activeCamera.position.z
            );
          }),
          // complete inner observable on mouseup event
          takeUntil(mouseUp$)
        );
      })
    )
    .subscribe();

  window["scene"] = scene;
});
