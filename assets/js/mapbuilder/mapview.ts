import {
  filter,
  map,
  mergeMap,
  Observable,
  scan,
  Subscription,
  takeUntil,
  tap,
} from "rxjs";

export class MapView {
  public canvas: HTMLCanvasElement;
  public metersHorizontal = 40; // number of squares we'd like to see in the horizontal axis
  public pixelsPerMeter: number;
  public engine: BABYLON.Engine;
  public scene: BABYLON.Scene;
  public camera: BABYLON.FreeCamera;
  //   camera.attachControl(canvas, true);

  public light: BABYLON.HemisphericLight;
  public mouseDown$: Observable<BABYLON.PointerInfo>;
  public mouseMove$: Observable<BABYLON.PointerInfo>;
  public mouseUp$: Observable<BABYLON.PointerInfo>;
  public mouseWheel$: Observable<BABYLON.PointerInfo>;
  public mouseUpRight$: Observable<BABYLON.PointerInfo>;

  public zoomSub: Subscription;
  public panSub: Subscription;
  public sectorPoints = [];

  constructor(id: string) {
    this.canvas = document.getElementById(id) as HTMLCanvasElement;

    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = new BABYLON.FreeCamera(
      "freeCam",
      new BABYLON.Vector3(0, 10, 0),
      this.scene
    );
    //   camera.attachControl(canvas, true);

    this.light = new BABYLON.HemisphericLight(
      "HemiLight",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    // this.camera.target = BABYLON.Vector3.Zero();
    this.camera.target = new BABYLON.Vector3(0, 0, 0.000001);

    this.setCameraMapping();
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      height: 200,
      width: 250,
      subdivisions: 4,
    });

    const box = BABYLON.MeshBuilder.CreateBox("", {}, this.scene);

    const defaultGridMaterial = new BABYLON.GridMaterial("gridMat", this.scene);
    ground.material = defaultGridMaterial;

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener("resize", () => {
      console.log("resized");
      this.engine.resize();
      this.setCameraMapping();
    });

    this.listenMouse();
    this.enablePan();
    this.enableZoom();
    this.enableCaptureSectorPoint();
    window["scene"] = this.scene;
  }

  enableCaptureSectorPoint() {
    this.mouseUp$
      .pipe(filter((info) => info.event.ctrlKey === true))
      .subscribe((info) => {
        const offsetX = this.engine.getRenderWidth() / 2 / this.pixelsPerMeter;
        const offsetZ = this.engine.getRenderHeight() / 2 / this.pixelsPerMeter;
        let x = info.event.x / this.pixelsPerMeter - offsetX;
        let z = -(info.event.y / this.pixelsPerMeter - offsetZ);
        // round to nearest meter
        x = Math.round(x);
        z = Math.round(z);
        console.log("calculated", x, z);
        // calculate a clicked point in x,z plane relative to
        // camera position
        console.log(
          "actual",
          info.pickInfo.pickedPoint.x,
          info.pickInfo.pickedPoint.z
        );
        // this.sectorPoints.push(info.pickInfo);
      });
  }

  listenMouse() {
    this.mouseDown$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = this.scene.onPointerObservable.add((data) => {
        if (data.type === BABYLON.PointerEventTypes.POINTERDOWN) {
          subscriber.next(data);
        }
      });
      return () => {
        this.scene.onPointerObservable.remove(babylonObserver);
      };
    });

    this.mouseMove$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = this.scene.onPointerObservable.add((data) => {
        if (data.type === BABYLON.PointerEventTypes.POINTERMOVE) {
          subscriber.next(data);
        }
      });
      return () => {
        this.scene.onPointerObservable.remove(babylonObserver);
      };
    });

    // this.mouseUpRight$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
    //   // wrap the babylonjs observable
    //   const babylonObserver = this.scene.onPointerObservable.add((data) => {
    //     if (data.type === BABYLON.PointerEventTypes.POINTERUP) {
    //       subscriber.next(data);
    //     }
    //   });
    //   return () => {
    //     this.scene.onPointerObservable.remove(babylonObserver);
    //   };
    // });

    this.mouseUp$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = this.scene.onPointerObservable.add((data) => {
        if (data.type === BABYLON.PointerEventTypes.POINTERUP) {
          subscriber.next(data);
        }
      });
      return () => {
        this.scene.onPointerObservable.remove(babylonObserver);
      };
    });

    this.mouseWheel$ = new Observable<BABYLON.PointerInfo>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = this.scene.onPointerObservable.add((data) => {
        if (data.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
          subscriber.next(data);
        }
      });
      return () => {
        this.scene.onPointerObservable.remove(babylonObserver);
      };
    });
  }

  enableZoom() {
    if (this.zoomSub) {
      return;
    }
    this.zoomSub = this.mouseWheel$.subscribe((data) => {
      const event = data.event as WheelEvent;
      this.metersHorizontal += event.deltaY / 2;
      this.pixelsPerMeter =
        this.engine.getRenderWidth() / this.metersHorizontal;
      if (this.metersHorizontal <= 5) {
        this.metersHorizontal = 5;
      }
      console.log(this.metersHorizontal);
      this.setCameraMapping();
    });
  }

  enablePan() {
    if (this.panSub) {
      return;
    }
    this.panSub = this.mouseDown$
      .pipe(
        filter((data: BABYLON.PointerInfo) => data.event.ctrlKey === false),
        map((downData) => ({
          x: downData.event.x,
          y: downData.event.y,
          // camX: this.scene.activeCamera.position.x,
          // camY: this.scene.activeCamera.position.z,
        })),
        mergeMap((moveData) => {
          return this.mouseMove$.pipe(
            // map((e) => ({ cx: e.event.x, cy: e.event.y })),
            scan(
              (
                acc: { x: number; y: number; deltaX: number; deltaY: number },
                moveData: BABYLON.PointerInfo
              ) => {
                acc.deltaX = acc.x - moveData.event.x;
                acc.deltaY = moveData.event.y - acc.y;
                acc.x = moveData.event.x;
                acc.y = moveData.event.y;
                return acc;
              },
              { ...moveData, deltaX: 0, deltaY: 0 }
            ),
            tap((v) => {
              // convert delta to number of meters

              this.scene.activeCamera.position.x +=
                v.deltaX / this.pixelsPerMeter;
              this.scene.activeCamera.position.z +=
                v.deltaY / this.pixelsPerMeter;
            }),
            // complete inner observable on mouseup event
            takeUntil(this.mouseUp$)
          );
        })
      )
      .subscribe();
  }

  disablePan() {
    this.panSub.unsubscribe();
    this.panSub = null;
  }

  setCameraMapping(): void {
    const widthInPx = this.engine.getRenderWidth();
    const heightInPx = this.engine.getRenderHeight();
    // We chose an orthographic view to simplify at most our mesh creation
    this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    this.pixelsPerMeter = widthInPx / this.metersHorizontal;
    // Setup the camera to fit with our gl coordinates in the canvas
    this.camera.unfreezeProjectionMatrix();
    this.camera.orthoTop = heightInPx / this.pixelsPerMeter / 2;
    this.camera.orthoLeft = -this.metersHorizontal / 2;
    this.camera.orthoBottom = -heightInPx / this.pixelsPerMeter / 2;
    this.camera.orthoRight = this.metersHorizontal / 2;
    this.camera.getProjectionMatrix(true);
    this.camera.freezeProjectionMatrix();
  }
}
