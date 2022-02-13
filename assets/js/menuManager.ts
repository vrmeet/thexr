// import type * as BABYLON from 'babylonjs'
// import * as GUI from 'babylonjs-gui'
// import { signalHub } from './signalHub';
// import { filter } from 'rxjs/operators'

// export class MenuManager {
//     public textureMenus: { [key: string]: GUI.AdvancedDynamicTexture };
//     public currentTexture: string


//     constructor(public slug: string, public scene: BABYLON.Scene) {
//         this.textureMenus = {}
//         this.currentTexture = null
//         signalHub.pipe(filter(msg => msg.event === 'open_menu')).subscribe(msg => {
//             console.log('menu manager received', msg)
//             //this.openMenu()
//         })
//         this.textureMenus['menu'] = this.menu()
//         this.currentTexture = 'menu'
//         context['menu'] = () => { this.switchTo('menu') }
//         context['about'] = () => { this.switchTo('about') }
//     }

//     async switchTo(textureName: string) {
//         console.log('hide previous menu')
//         console.log('load', textureName)
//         this.textureMenus[textureName] = await this[textureName]()
//         if (this.currentTexture) {
//             this.textureMenus[this.currentTexture].dispose()
//         }
//         this.currentTexture = textureName




//     }

//     menu() {

//         let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

//         let rect = div({ name: "menu_rect" },
//             a({ name: "btn_about", href: "about" }, "About"),
//             a({ name: "btn_edit", href: "edit" }, "Edit"),
//             a({ name: "btn_avatar", href: "avatar" }, "Avatar"),
//             a({ name: "btn_inventory", href: "inventory" }, "Inventory"),
//         )

//         advancedTexture.addControl(rect)

//         styleByName(advancedTexture, "menu_rect", {
//             width: 0.1,
//             height: "200px",
//             cornerRadius: 20,
//             color: "Purple",
//             thickness: 4,
//             background: "gray",
//         })

//         styleByType(advancedTexture, "Button", {
//             verticalAlignment: GUI.Control.VERTICAL_ALIGNMENT_TOP,
//             color: "white",
//             cornerRadius: 20,
//             background: "green",
//             highlightColor: "#FF0000",
//             hoverCursor: "pointer",
//             isPointerBlocker: true
//         })

//         return advancedTexture;

//     }

//     async about() {

//         let query = `query($slug: String!) {
//             space(slug: $slug) {
//                 name
//                 description
//             }
//           }`
//         let variables = { slug: this.slug }
//         let data = await this.makeQuery(query, variables)

//         let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('about_texture')


//         let content = div({ name: 'about_c' },
//             a({ name: "back", href: "menu" }, "< Back"),
//             JSON.stringify(data),
//         )
//         advancedTexture.addControl(content)

//         styleByName(advancedTexture, "about_c", {
//             width: 0.1,
//             height: "200px",
//             cornerRadius: 20,
//             color: "Purple",
//             thickness: 4,
//             background: "gray",
//         })

//         return advancedTexture

//     }
//     async edit() {
//         console.log('edit')
//     }

//     async makeQuery(query: string, variables: any) {


//         let result = fetch('/api', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json',
//             },
//             body: JSON.stringify({
//                 query,
//                 variables,
//             })
//         })
//         return (await result).json()

//     }

//     async openContent() {
//         var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("Content", true, this.scene);
//         advancedTexture.idealWidth = 3000;
//         var rect1 = new GUI.Rectangle();
//         rect1.left = "500px";
//         rect1.width = 0.6;
//         rect1.height = "600px";
//         rect1.cornerRadius = 20;
//         rect1.color = "Orange";
//         rect1.thickness = 4;
//         rect1.background = "green";
//         rect1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
//         advancedTexture.addControl(rect1);

//     }


//     // async openMenu() {

//     //     const leftMenuConfig = [
//     //         { label: 'About', click: () => { this.about() } },
//     //         { label: 'Edit', click: () => { this.edit() } }
//     //     ]
//     //     this.buildMenu(leftMenuConfig)

//     //     //this.buildMenu()
//     //     // console.log("create menu")
//     //     // var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
//     //     // advancedTexture.idealWidth = 1000;


//     //     // var rect1 = new GUI.Rectangle();

//     //     // rect1.width = 0.2;
//     //     // rect1.height = "200px";
//     //     // rect1.cornerRadius = 20;
//     //     // rect1.color = "Orange";
//     //     // rect1.thickness = 4;
//     //     // rect1.background = "green";
//     //     // rect1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
//     //     // advancedTexture.addControl(rect1);

//     //     // var button1 = GUI.Button.CreateSimpleButton("but1", "About");
//     //     // button1.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
//     //     // button1.width = "150px"
//     //     // button1.height = "40px";
//     //     // button1.color = "white";
//     //     // button1.cornerRadius = 20;
//     //     // button1.background = "green";
//     //     // button1.highlightColor = "#FF0000"
//     //     // button1.hoverCursor = "pointer";
//     //     // button1.isPointerBlocker = true;
//     //     // button1.onPointerUpObservable.add(() => {
//     //     //     this.openContent()
//     //     //     this.getSpace()
//     //     // });
//     //     // rect1.addControl(button1)
//     //     // //advancedTexture.addControl(button1);

//     // }
// }