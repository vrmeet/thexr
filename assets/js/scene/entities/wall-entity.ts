import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs";
import { from } from "rxjs";
import { scan, pairwise, bufferCount } from "rxjs/operators";
import { reduceSigFigs } from "../../utils/misc";

export class WallEntity extends EntityBase {
  public baseEmitFunction;
  public runtimeComponentsAsObj: Record<string, any>;
  constructor(public scene: BABYLON.Scene) {
    super("wall", scene);
    this.runtimeComponentsAsObj = {};
    this.baseEmitFunction = super.emitCreateEntityEvent;
  }

  defaultComponentAsObject(): Record<string, any> {
    return {
      position: this.cameraFrontFloorPosition(),
      color: "#DEB887",
      editable: true,
      ...this.runtimeComponentsAsObj,
    };
  }

  getWallMiddle(globalPoints: BABYLON.Vector3[]): {
    middleX: number;
    middleZ: number;
  } {
    const minsAndMaxes = globalPoints.reduce(
      (acc, point) => {
        if (point.x > acc.maxX) {
          acc.maxX = point.x;
        }
        if (point.x < acc.minX) {
          acc.minX = point.x;
        }
        if (point.z > acc.maxZ) {
          acc.maxZ = point.z;
        }
        if (point.z < acc.minZ) {
          acc.minZ = point.z;
        }
        return acc;
      },
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
      }
    );
    return {
      middleX: (minsAndMaxes.minX + minsAndMaxes.maxX) / 2,
      middleZ: (minsAndMaxes.minZ + minsAndMaxes.maxZ) / 2,
    };
  }

  emitCreateEntityEvent(opts: { globalPoints: BABYLON.Vector3[] }) {
    // find middle point of model
    const middle = this.getWallMiddle(opts.globalPoints);
    // offset between this middle and the origin, is just itself minus 0
    const offsetPosition = new BABYLON.Vector3(
      middle.middleX,
      0,
      middle.middleZ
    );
    const pointsInLocalSpace = opts.globalPoints.map(globalPoint =>
      globalPoint.subtract(offsetPosition)
    );
    const xzPoints = pointsInLocalSpace.reduce((acc, wallPoint) => {
      acc.push(reduceSigFigs(wallPoint.x));
      acc.push(reduceSigFigs(wallPoint.z));
      return acc;
    }, []);

    this.runtimeComponentsAsObj = {
      points: xzPoints,
      height: 2,
      position: offsetPosition.asArray(),
    };

    this.baseEmitFunction();
    // // let dest = ray.origin.add(ray.direction)
    // const name = `${this.type}_${random_id(6)}`
    // const uuid = uuidv4()

    // const entity_event: event = { m: EventName.entity_created, p: { type: this.type, id: uuid, name, components: this.defaultComponents() } }

    // signalHub.outgoing.emit('event', entity_event)
    // signalHub.incoming.emit('event', entity_event)
  }

  /**
   * Given a list of points in object space, draw a wall there
   * @returns
   */
  createWall = (points: number[], height: number = 2) => {
    let parts: BABYLON.Mesh[] = [];

    from(points)
      .pipe(
        bufferCount(2), // [x,z]
        pairwise(), // [[x1,z1], [x2,z2]]
        scan((acc, curr) => ({ partCount: acc.partCount + 1, points: curr }), {
          partCount: 0,
          points: [],
        })
      )
      .subscribe(data => {
        // for each pair of points, draw a wall

        let point1 = new BABYLON.Vector3(
          data.points[0][0],
          0,
          data.points[0][1]
        );
        let point2 = new BABYLON.Vector3(
          data.points[1][0],
          0,
          data.points[1][1]
        );
        // length of the wall is the distance between points
        let length = BABYLON.Vector3.Distance(point1, point2);
        let wall = BABYLON.MeshBuilder.CreateBox(
          "",
          { width: 0.1, depth: length, height },
          this.scene
        );
        parts.push(wall);
        let c1;
        // if this is the first wall, make a tube at the end
        if (data.partCount === 1) {
          c1 = BABYLON.MeshBuilder.CreateCylinder(
            "",
            { height: height, diameter: 0.1 },
            this.scene
          );
          c1.position.copyFromFloats(point1.x, height / 2, point1.z);
          parts.push(c1);
        }

        let c2 = BABYLON.MeshBuilder.CreateCylinder(
          "",
          { height: height, diameter: 0.1 },
          this.scene
        );
        c2.position.copyFromFloats(point2.x, height / 2, point2.z);
        parts.push(c2);

        // find midpoint between points
        let diff = point2.subtract(point1);
        let midpoint = new BABYLON.Vector3(
          point1.x + diff.x / 2,
          point1.y + diff.y / 2,
          point1.z + diff.z / 2
        );
        // move wall to the midpoint
        wall.position.copyFromFloats(midpoint.x, height / 2, midpoint.z);

        // find angle between points
        let alpha = Math.atan2(-1 * diff.x, -1 * diff.z);
        wall.rotation.y = alpha;
      });
    let mergedMesh = BABYLON.Mesh.MergeMeshes(parts, true);
    if (mergedMesh) {
      mergedMesh.name = this.name;
      return mergedMesh;
    } else {
      throw new Error(`Wall error building ${name}`);
    }
  };

  createMesh() {
    const { height, points } = this.argifyComponents(this.components, [
      "height",
      "points",
    ]);
    console.log("hiehgt", height, "points", points);
    return this.createWall(points, height);
    // return BABYLON.MeshBuilder.CreateBox(this.name, { width: 1, depth: 1, height: 0.05 }, this.scene)
  }
}
