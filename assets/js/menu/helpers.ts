
import * as GUI from 'babylonjs-gui'
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

export const applyAttributes = (el: any, props: { [key: string]: any }) => {
    if (typeof props === 'object' && props !== null) {
        Object.keys(props).forEach(key => {
            try {
                if (key != 'callback') {
                    el[key] = props[key]
                }
            } catch (e) {
                console.log(e)
            }
        })
    }
}

export const g = (guiType: any, props: { [key: string]: any }, ...children: child[]): GUI.Container => {
    let el = new guiType() as GUI.Container
    el.clipChildren = false
    applyAttributes(el, props)
    let nodes = children.map(child => ((typeof child === 'object') ? child : g(GUI.TextBlock, {
        text: child
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



export const styleByName = (texture: GUI.AdvancedDynamicTexture, guiName: string, props: { [key: string]: any }) => {
    const el = texture.getControlByName(guiName)
    if (el) {
        applyAttributes(el, props)
    }
}

export const styleByType = (texture: GUI.AdvancedDynamicTexture, guiType: string, props: { [key: string]: any }) => {
    texture.getControlsByType(guiType).forEach(el => {
        applyAttributes(el, props)
    })
}


export const button = (props: { [key: string]: any }, ...children: child[]): GUI.Container => {
    return g(GUI.Button, props, ...children)
}

export const div = (props: { [key: string]: any }, ...children: child[]): GUI.Container => {
    let defaults = {
        cornerRadius: 20,
        color: "Purple",
        thickness: 4,
        background: "gray",
        adaptHeightToChildren: true,
        adaptWidthToChildren: true,
        isPointerBlocker: true
    }
    return g(GUI.Rectangle, { ...defaults, ...props }, ...children)
}

export const pre = (props: { [key: string]: any }, ...children: child[]) => {
    const defaults = {
        width: 1,
        height: "200px",
        background: "white",
        horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        verticalAlignment: GUI.Control.VERTICAL_ALIGNMENT_TOP
    }
    return g(GUI.ScrollViewer, { ...defaults, ...props }, ...children)

}

export const span = (props: { [key: string]: any }, ...children: child[]) => {
    const stackDefaults = { name: 'hsp', isVertical: false, height: "40px", width: "400px", clipChildren: false }
    let horizontalStackPanel = g(GUI.StackPanel, { ...stackDefaults, ...props })

    let label = g(GUI.TextBlock, { name: 'editLabel', horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT, text: "Edit", width: "40px" })
    let nodes = children.map(child => ((typeof child === 'object') ? child : g(GUI.TextBlock, {
        text: child
    }
    ))).forEach(child => {
        child.width = "100px"
        horizontalStackPanel.addControl(child)
    })
    return horizontalStackPanel
}

export const toggle = (props: { [key: string]: any }, ...children: child[]): GUI.Container => {
    const defaults = {
        value: 0,
        isPointerBlocker: true,
        horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        width: "80px",
        color: 'green',
        background: 'red',
        isThumbClamped: true,
        isThumbCircle: true,
        minimum: 0.0,
        maximum: 1.0,
        step: 1
    }
    return g(GUI.Slider, { ...defaults, ...props })
}



export const a = (props: { [key: string]: any }, text: string): GUI.Container => {
    if (!props["callback"]) {
        console.error("callback is required", props)
    }
    let el = g(GUI.Button, {
        hoverCursor: "pointer",
        horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        isPointerBlocker: true, ...props,
    }, g(GUI.TextBlock, {
        text: text,
        color: "#0000FF",
        textHorizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        paddingLeft: "10px"
    }
    ))

    el.onPointerUpObservable.add(props.callback)
    return el
}
