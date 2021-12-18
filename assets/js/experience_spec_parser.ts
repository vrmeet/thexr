import * as BABYLON from 'babylonjs'

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
           <box name="desk" position="[0,0,0]"/>
           <box name="desk2" position="[-2,0,0]"/>
         </state>
         <state name="part2">
           <box name="desk" position="[1,1,-1]" rotation="[0,0.5,0]" scaling="[1,5,1]"/>
           
         </state>
       </states>
       `
        this.xmlDoc = this.parser.parseFromString(this.spec, "text/xml");
        window['xmlDoc'] = this.xmlDoc
        //  this.parse()
    }

    //     parse() {
    //         const parser = new DOMParser();
    // const xmlDoc = parser.parseFromString(this.spec, "text/xml");

    // let statesElement = xmlDoc.getElementsByTagName("states")[0]

    // for (let i = 0; i < statesElement.childElementCount; i++) {
    //     let state = statesElement.children[i]
    //     for (let j = 0; j < state.childElementCount; j++) {
    //         let entity = state.children[j]
    //         console.log("entityNodeName", entity.nodeName, "properties", entity.attributes)
    //     }
    // }
    //     }

    getFullName(entity: Element) {
        return `${entity.nodeName}-${entity.getAttribute('name')}`
    }

    createOrFindMesh(entity: Element) {
        console.log("entityNodeName", entity.nodeName, "properties", entity.attributes)
        let fullName = this.getFullName(entity)
        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshByName(fullName)
        if (!mesh) {
            if (entity.nodeName === 'box') {
                mesh = BABYLON.MeshBuilder.CreateBox(fullName, {}, this.scene)
            }
        }
        BABYLON.Tags.AddTagsTo(mesh, this.state)
        if (this.previousState) {
            BABYLON.Tags.RemoveTagsFrom(mesh, this.previousState)
        }
        return mesh
    }

    updateMesh(mesh: BABYLON.AbstractMesh, entity: Element) {
        ['position', 'rotation', 'scaling'].forEach(attr => {
            if (entity.getAttribute(attr)) {
                mesh[attr] = BABYLON.Vector3.FromArray(JSON.parse(entity.getAttribute(attr)))
            }
        })
    }

    stateChange(stateName: string) {
        this.previousState = this.state
        this.state = stateName

        let stateElement = this.xmlDoc.getElementsByName(stateName)[0]
        for (let j = 0; j < stateElement.childElementCount; j++) {
            let entity = stateElement.children[j]
            let mesh = this.createOrFindMesh(entity)
            this.updateMesh(mesh, entity)
        }
        if (this.previousState) {
            console.log("the previous state is", this.previousState)
            let previousMeshes = this.scene.getMeshesByTags(this.previousState)
            console.log('the previous meshes are', previousMeshes)
            previousMeshes.forEach(mesh => {
                mesh.dispose()
            })
        }


        // this.scene...
    }
}