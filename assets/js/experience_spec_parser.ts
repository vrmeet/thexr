import * as BABYLON from 'babylonjs'
import * as MAT from 'babylonjs-materials'

export class ExperienceSpecParser {
    public parser: DOMParser
    public xmlDoc: XMLDocument
    public state: string | null
    public previousState: string | null
    constructor(public spec: string, public scene: BABYLON.Scene) {
        this.state = null
        this.previousState = null
        this.parser = new DOMParser()
        this.spec = `
       <states>
         <state name="part1">
           <box name="desk" position="0 0 0" color="#FF0000"/>
           <box name="desk2" position="-2 0 0" color="#00FF11" />
           <plane name="floor" position="0 2 0" color="#222222" />
           <sphere name="mysphre" position="0 0 -5" color="#FFFF00" />
         </state>
         <state name="part2">
           <box name="desk" position="1 1 -1" rotation="0 0.5 0" scaling="1 5 1"/>
           <box name="desk2" position="3 2 -1" rotation="0 0.5 0" scaling="1 1 1"/>
           <box name="desk3" position="-2 -1 0" rotation="0 1 0" scaling="1 1 1"/>
         </state>
         <state name="part3">
            <box name="desk" position="1 1 -1" rotation="0 0.5 0" scaling="1 5 1"/>
            <box name="desk2" position="3 2 -1" rotation="0 0.5 0" scaling="1 1 1"/>
            <box name="desk3" position="-1 -0.5 0" rotation="0 1 0" scaling="1 1 1" color="#0000FF" />
         </state>
       </states>
       `
        this.xmlDoc = this.parser.parseFromString(this.spec, "text/xml");
        window['xmlDoc'] = this.xmlDoc
        //  this.parse()
    }


    getFullName(entity: Element) {
        return `${entity.nodeName}-${entity.getAttribute('name')}`
    }

    findOrCreateMesh(entity: Element) {
        let fullName = this.getFullName(entity)
        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshByName(fullName)
        if (!mesh) {
            if (entity.nodeName === 'box') {
                mesh = BABYLON.MeshBuilder.CreateBox(fullName, {}, this.scene)
            } else if (entity.nodeName === 'plane') {
                mesh = BABYLON.MeshBuilder.CreatePlane(fullName, {}, this.scene)
            } else if (entity.nodeName === 'sphere') {
                mesh = BABYLON.MeshBuilder.CreateSphere(fullName, {}, this.scene)
            }
        }
        BABYLON.Tags.AddTagsTo(mesh, this.state)
        if (this.previousState) {
            BABYLON.Tags.RemoveTagsFrom(mesh, this.previousState)
        }
        return mesh
    }



    findOrCreateMaterial(opts: { type: 'color' | 'grid', colorString?: string }) {
        if (opts.type === 'color' && opts.colorString) {
            let mat = this.scene.getMaterialByName(`mat_${opts.colorString}`)
            if (mat) {
                return mat
            } else {
                let myMaterial = new BABYLON.StandardMaterial(`mat_${opts.colorString}`, this.scene);
                let color = BABYLON.Color3.FromHexString(opts.colorString)
                myMaterial.diffuseColor = color;
                return myMaterial
            }
        } else {
            return this.scene.getMaterialByName("mat_grid") || (new MAT.GridMaterial("mat_grid", this.scene))
        }
    }

    arrayFromAttr(attr: string) {
        return attr.trim().split(' ').filter(el => el).map(el => parseFloat(el))
    }

    updateMesh(mesh: BABYLON.AbstractMesh, entity: Element) {
        ['position', 'rotation', 'scaling'].forEach(attr => {
            const value = entity.getAttribute(attr)
            if (value) {
                mesh[attr] = BABYLON.Vector3.FromArray(this.arrayFromAttr(value))
            } else {
                if (attr === 'scaling') {
                    mesh[attr] = BABYLON.Vector3.FromArray([1, 1, 1])
                } else {
                    mesh[attr] = BABYLON.Vector3.FromArray([0, 0, 0])
                }
            }
        })
        let color = entity.getAttribute('color')
        if (color) {
            mesh.material = this.findOrCreateMaterial({ type: 'color', colorString: color })
        }
    }

    stateChange(stateName: string) {
        this.previousState = this.state
        this.state = stateName

        let stateElement = this.xmlDoc.getElementsByName(stateName)[0]
        for (let j = 0; j < stateElement.childElementCount; j++) {
            let entity = stateElement.children[j]
            let mesh = this.findOrCreateMesh(entity)
            this.updateMesh(mesh, entity)
            console.log('created or found', mesh.name)
        }
        if (this.previousState) {
            console.log("the previous state is", this.previousState)
            let previousMeshes = this.scene.getMeshesByTags(this.previousState)
            previousMeshes.forEach(mesh => {
                console.log("mesh to delete", mesh.name)
                mesh.dispose()
            })
        }


        // this.scene...
    }
}