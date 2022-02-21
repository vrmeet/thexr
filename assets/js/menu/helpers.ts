
import * as GUI from 'babylonjs-gui'
import type { string } from 'yup'
import { signalHub } from '../signalHub'
import type { SignalEvent } from '../types'

/* patch to fix toggle snapping */
BABYLON.GUI.BaseSlider.prototype['_updateValueFromPointer'] = function (x, y) {
    console.log(x, y)
    if (this.rotation != 0) {
        this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
        x = this._transformedPosition.x;
        y = this._transformedPosition.y;
    }

    let value;
    if (this._isVertical) {
        value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
    }
    else {
        value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
    }

    //this.value = this._step ? ((value / this._step) | 0) * this._step : value;
    this.value = this._step ? Math.round(value / this._step) * this._step : value;
    console.log('new value is ....', this.value)
}




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
    let defaults = {
        cornerRadius: 20,
        color: "Purple",
        thickness: 4,
        background: "gray",
    }
    return g(GUI.Rectangle, { ...defaults, props }, ...children)
}

export const span = (props: any, ...children: child[]) => {
    const stackDefaults = { name: 'hsp', isVertical: false, height: "40px", width: "400px", clipChildren: false }
    let horizontalStackPanel = g(GUI.StackPanel, { ...stackDefaults, ...props })

    let label = g(GUI.TextBlock, { name: 'editLabel', horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT, text: "Edit", width: "40px" })
    let nodes = children.map(child => ((typeof child === 'object') ? child : g(GUI.TextBlock, {
        text: child,
        fontSize: 24,
    }
    ))).forEach(child => {
        child.width = "100px"
        horizontalStackPanel.addControl(child)
    })
    return horizontalStackPanel
}

export const toggle = (props: any, ...children: child[]): GUI.Container => {
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



export const a = (props: any, text: string): GUI.Container => {
    if (!props["msg"]) {
        console.error("msg is required", props)
    }
    let el = g(GUI.Button, {
        hoverCursor: "pointer",
        horizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        isPointerBlocker: true, ...props,
    }, g(GUI.TextBlock, {
        text: text,
        fontSize: 24,
        color: "#0000FF",
        textHorizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
        paddingLeft: "10px"
    }
    ))

    el.onPointerUpObservable.add(() => {
        signalHub.next(props.msg as SignalEvent)
    })
    return el
}
