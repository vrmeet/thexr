
import * as GUI from 'babylonjs-gui'
import type { string } from 'yup'
import { signalHub } from '../signalHub'

type child = GUI.Container | string

/*

https://andela.com/insights/building-your-own-version-of-react-from-scratch-part-1/
export function createElement(type, configObject, ...args) {
    const props = Object.assign({}, configObject);
    const hasChildren = args.length > 0;
    const nodeChildren = hasChildren ? [...args] : [];
    props.children = nodeChildren
      .filter(Boolean)
      .map(c => (c instanceof Object ? c : createTextElement(c)));

    return { type, props };
  }
*/

export const applyAttributes = (el: any, props: any) => {
    if (typeof props === 'object' && props !== null) {
        Object.keys(props).forEach(key => {
            try {
                el[key] = props[key]
            } catch (e) {
                console.log(e)
            }
        })
    }
}

export const g = (guiType: any, props: any, ...children: child[]): GUI.Container => {
    let el = new guiType() as GUI.Container
    el.clipChildren = false
    applyAttributes(el, props)
    let nodes = children.map(child => ((typeof child === 'object') ? child : g(GUI.TextBlock, {
        text: child,
        fontSize: 24,
    }
    )))
    switch (nodes.length) {
        case 0:
            break
        case 1:
            el.addControl(nodes[0])
            break;
        default:
            let panel = new GUI.StackPanel();
            panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
            nodes.forEach(child => {
                if (child.height == "100%") {
                    child.height = "50px"
                }
                panel.addControl(child)
            })
            el.addControl(panel)
    }
    return el
}



export const styleByName = (texture: GUI.AdvancedDynamicTexture, guiName: string, props: any) => {
    const el = texture.getControlByName(guiName)
    if (el) {
        applyAttributes(el, props)
    }
}

export const styleByType = (texture: GUI.AdvancedDynamicTexture, guiType: string, props: any) => {
    texture.getControlsByType(guiType).forEach(el => {
        applyAttributes(el, props)
    })
}


export const button = (props: any, ...children: child[]): GUI.Container => {
    return g(GUI.Button, props, ...children)
}

export const div = (props: any, ...children: child[]): GUI.Container => {
    return g(GUI.Rectangle, props, ...children)
}



export const a = (props: any, text: string): GUI.Container => {
    if (!props["target"]) {
        console.error("no target on menu link")
    }
    let el = g(GUI.Button, {
        name: `btn_${props['target']}`,
        hoverCursor: "pointer",
        horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        isPointerBlocker: true, ...props,
    }, g(GUI.TextBlock, {
        name: `txt_${props['target']}`,
        text: text,
        fontSize: 24,
        color: "#0000FF",
        textHorizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        paddingLeft: "10px"
    }
    ))

    el.onPointerUpObservable.add(() => {
        signalHub.next({ event: 'open_menu', payload: { target: props["target"] } })
    })
    return el
}
