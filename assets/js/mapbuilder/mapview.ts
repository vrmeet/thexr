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
import { random_id } from "../utils/misc";

class Sector {
  xzPoints: number[][] = [];
  floorHeight: number;
  ceilingHeight: number;
  assetContainer: BABYLON.AssetContainer;
  constructor(public name: string) {
    this.assetContainer = new BABYLON.AssetContainer();
  }
  addPoint(x: number, z: number) {
    if (this.pointExists(x, z) && this.xzPoints.length < 3) {
      return; // don't allow
    }
    this.xzPoints.push([x, z]);
  }
  isClosed() {
    return (
      this.xzPoints.length > 3 &&
      this.pointEqual(this.xzPoints[0], this.xzPoints[this.xzPoints.length - 1])
    );
  }
  pointEqual(p1: number[], p2: number[]) {
    return p1[0] == p2[0] && p1[1] == p2[1];
  }
  pointExists(x: number, z: number): boolean {
    return this.xzPoints.find(([_x, _z]) => x == _x && z == _z) !== undefined;
  }
  clearAssetContainer() {
    this.assetContainer.meshes.forEach((m) => {
      m.dispose();
    });
    this.assetContainer.meshes.length = 0;
  }
  drawSector() {
    this.clearAssetContainer();

    // from(this.points)
    //   .pipe(
    //     bufferCount(2), // [x,z]
    //     pairwise() // [[x1,z1], [x2,z2]]
    //   )
    //   .subscribe((data) => {
    //     // draw lines
    //     console.log("pairwise data", data);
    //   });

    if (this.xzPoints.length > 1) {
      const lineOpts = {
        points: this.xzPoints.map(([_x, _z]) => new BABYLON.Vector3(_x, 0, _z)),
        dashSize: 2,
        gapSize: 1,
        dashNb: 80,
      };
      const lines = BABYLON.MeshBuilder.CreateDashedLines(
        "sectorOutline",
        lineOpts
      );
      this.assetContainer.meshes.push(lines);
      if (this.isClosed()) {
        const polygon_triangulation = new BABYLON.PolygonMeshBuilder(
          `${this.name}polygon`,
          this.xzPoints.map(([x, z]) => new BABYLON.Vector2(x, z))
        );
        const polygon = polygon_triangulation.build();
        this.assetContainer.meshes.push(polygon);
      }
    }

    this.xzPoints.forEach(([_x, _z]) => {
      const pt = BABYLON.MeshBuilder.CreateBox(`sp${_x}-${_z}`, {
        size: 0.3,
      });
      pt.position.x = _x;
      pt.position.z = _z;
      this.assetContainer.meshes.push(pt);
    });
  }
  //   // this.sectorPoints.forEach(([x, z]) => {
  //   //   const m = BABYLON.MeshBuilder.CreateBox("", { size: 0.3 }, this.scene);
  //   //   m.position.x = x;
  //   //   m.position.z = z;
  //   // });
  // }
}

export class MapView {
  public canvas: HTMLCanvasElement;
  public metersHorizontal = 40; // number of squares we'd like to see in the horizontal axis
  public pixelsPerMeter: number;
  public engine: BABYLON.Engine;
  public scene: BABYLON.Scene;
  public camera: BABYLON.FreeCamera;
  public sectors: Sector[] = [];
  //   camera.attachControl(canvas, true);

  public light: BABYLON.HemisphericLight;
  public mouseDown$: Observable<BABYLON.PointerInfo>;
  public mouseMove$: Observable<BABYLON.PointerInfo>;
  public mouseUp$: Observable<BABYLON.PointerInfo>;
  public mouseWheel$: Observable<BABYLON.PointerInfo>;
  public mouseUpRight$: Observable<BABYLON.PointerInfo>;

  public zoomSub: Subscription;
  public panSub: Subscription;

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

    this.sectors.push(new Sector(random_id(3)));

    window["scene"] = this.scene;
    window["mapview"] = this;
  }

  enableCaptureSectorPoint() {
    this.mouseUp$
      .pipe(filter((info) => info.event.ctrlKey === true))
      .subscribe((info) => {
        const offsetX = this.engine.getRenderWidth() / 2 / this.pixelsPerMeter;
        const offsetZ = this.engine.getRenderHeight() / 2 / this.pixelsPerMeter;
        let x =
          this.camera.position.x + info.event.x / this.pixelsPerMeter - offsetX;
        let z =
          this.camera.position.z -
          (info.event.y / this.pixelsPerMeter - offsetZ);
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
        const lastIndex = this.sectors.length - 1;
        this.sectors[lastIndex].addPoint(x, z);
        this.sectors[lastIndex].drawSector();
        if (this.sectors[lastIndex].isClosed()) {
          this.sectors.push(new Sector(random_id(3)));
        }
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
    this.zoomSub = this.mouseWheel$
      // .pipe(filter((info) => info.event.ctrlKey))
      .subscribe((data) => {
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

    // this.panSub = this.mouseWheel$
    //   .pipe(filter((info) => info.event.shiftKey))
    //   .subscribe((data) => {
    //     const event = data.event as WheelEvent;
    //     this.scene.activeCamera.position.x +=
    //       event.deltaX / this.pixelsPerMeter;
    //     this.scene.activeCamera.position.z -=
    //       event.deltaY / this.pixelsPerMeter;
    //   });

    this.panSub = this.mouseDown$
      .pipe(
        // filter((data: BABYLON.PointerInfo) => data.event.shiftKey),
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
