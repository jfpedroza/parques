
// Type definitions for jCanvas 15.2
// Project: https://github.com/caleb531/jcanvas
// Definitions by: Rogier Schouten <https://github.com/rogierschouten>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="jquery"/>

interface JCanvasRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface JCanvasLayerBase {
    layer?: boolean;
    name?: string;
    groups?: string[];
    rotate?: number;
    translateX?: number;
    translateY?: number;
}

interface JCanvasSliceDef extends JCanvasLayerBase {
    fillStyle?: string;
    x?: number;
    y?: number;
    /**
     * Radius in pixels
     */
    radius?: number;
    /**
     * Start angle in degrees from north
     */
    start?: number;
    /**
     * End angle in degrees from north
     */
    end?: number;
    /**
     * Distance between slices as a fraction of the radius
     */
    spread?: number;
}

interface JCanvasTextDef extends JCanvasLayerBase {
    fillStyle?: string;
    strokeStyle?: string;
    strokeWidth?: number;
    x?: number;
    y?: number;
    fontSize?: number;
    fontFamily?: string;
    text?: string;
    fontStyle?: string;
}

interface JCanvasImageDef extends JCanvasLayerBase {
    source?: string|HTMLElement;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    fromCenter?: boolean;
    load?: Function;
}

interface JCanvasRectDef extends JCanvasLayerBase {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fromCenter?: boolean;
    fillStyle?: string;
    strokeStyle?: string;
    strokeWidth?: number;
    cornerRadius?: number;
}

interface JCanvasEllipseDef extends JCanvasLayerBase {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fromCenter?: boolean;
    fillStyle?: string;
    strokeStyle?: string;
    strokeWidth?: number;
}

interface JCanvasLayerDef extends JCanvasSliceDef,
    JCanvasTextDef, JCanvasImageDef, JCanvasRectDef,
    JCanvasEllipseDef {
    type: string;
}

interface JCanvasRotateDef extends JCanvasLayerBase {
    rotate: number;
    x: number;
    y: number;
}

interface JQuery {

    /**
     * This clearCanvas() clears all or any part of the canvas
     * If nothing is passed, the entire canvas is cleared.
     * Clearing a section works in the same way as drawing a rectangle,
     * with the rectangle being drawn from its center (by default).
     */
    clearCanvas(rect?: JCanvasRect): void;

    /**
     * A slice in jCanvas is, essentially, a slice of a circle (similar to a pizza slice).
     * You can draw a slice using the drawSlice() method. The size of a slice is determined by its start, end, and radius properties.
     * The position of a slice is determined by its x and y properties. These coordinates lie at the tip of the slice.
     */
    drawSlice(def: JCanvasSliceDef): void;

    /**
     * To draw text on the canvas, use the drawText() method.
     * The resulting text on the canvas is determined by the value of the text property, as well as any of the following font properties:
     * fontStyle
     * fontSize
     * fontFamily
     */
    drawText(def: JCanvasTextDef): void;

    drawImage(def: JCanvasImageDef): JQuery;

    drawRect(def: JCanvasRectDef): JQuery;

    drawEllipse(def: JCanvasEllipseDef): JQuery;

    addLayer(def: JCanvasLayerDef): JQuery;

    drawLayers(): void;

    rotateCanvas(def: JCanvasRotateDef): JQuery;

    restoreCanvas(def?: JCanvasLayerBase): void;
}

// note this declare module is necessary to tell TypeScript not to interpret the whole file as one module;
// the JQuery interface below should extend the existing jquery module interface
declare module "jcanvas" {
    function jcanvas(jquery: JQueryStatic, window: Window): void;
    export = jcanvas;
}

/* declare module "jcanvas-custom" {

}*/