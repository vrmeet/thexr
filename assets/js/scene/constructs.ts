import * as BABYLON from "babylonjs"
import { from } from "rxjs"
import { pairwise, scan, bufferCount } from "rxjs/operators"

export const createWall = (name: string, height: number, points: number[], scene: BABYLON.Scene) => {
    let parts: BABYLON.Mesh[] = []

    from(points).pipe(
        bufferCount(2), // [x,z]
        pairwise(), // [[x1,z1], [x2,z2]]
        scan((acc, curr) => ({ partCount: acc.partCount + 1, points: curr }), { partCount: 0, points: [] })
    ).subscribe(data => {
        // for each pair of points, draw a wall

        let point1 = new BABYLON.Vector3(data.points[0][0], 0, data.points[0][1])
        let point2 = new BABYLON.Vector3(data.points[1][0], 0, data.points[1][1])
        console.log("point1", point1.asArray())
        console.log("point2", point2.asArray())
        // length of the wall is the distance between points
        let length = BABYLON.Vector3.Distance(point1, point2)
        let wall = BABYLON.MeshBuilder.CreateBox("", { width: 0.1, depth: length, height }, scene)
        parts.push(wall)
        let c1;
        // if this is the first wall, make a tube at the end
        if (data.partCount === 1) {
            c1 = BABYLON.MeshBuilder.CreateCylinder("", { height: height, diameter: 0.1 }, scene)
            c1.position.copyFromFloats(point1.x, height / 2, point1.z)
            parts.push(c1)
        }

        let c2 = BABYLON.MeshBuilder.CreateCylinder("", { height: height, diameter: 0.1 }, scene)
        c2.position.copyFromFloats(point2.x, height / 2, point2.z)
        parts.push(c2)

        // find midpoint between points
        let diff = point2.subtract(point1)
        let midpoint = new BABYLON.Vector3(point1.x + (diff.x / 2), point1.y + (diff.y / 2), point1.z + (diff.z / 2))
        // move wall to the midpoint
        wall.position.copyFromFloats(midpoint.x, height / 2, midpoint.z)

        // find angle between points
        let alpha = Math.atan2(-1 * diff.x, -1 * diff.z)
        wall.rotation.y = alpha


    })
    let mergedMesh = BABYLON.Mesh.MergeMeshes(parts, true)
    mergedMesh.name = name
    return mergedMesh

}
