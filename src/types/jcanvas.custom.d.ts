
interface JCanvasImageDef {
    source: string|HTMLElement;
    x: number;
    y: number;
    width?: number;
    height?: number;
    scale?: number;
    fromCenter?: boolean;
    layer?: boolean;
}

interface JCanvasLayerDef {
    type: string;
    source?: string|HTMLElement;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    fromCenter?: boolean;
    layer?: boolean;
}

interface JQuery {

    drawImage(def: JCanvasImageDef): JQuery;

    addLayer(def: JCanvasLayerDef): JQuery;

    drawLayers(): void;
}

declare module "jcanvas-custom" {

}