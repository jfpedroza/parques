/**
 * @author Jhon Pedroza <jhonfpedroza@gmail.com>
 */

/**
 * Interface Color define metodos y propiedades del objeto Color.
 *
 * @interface Color
 * @version 1.0
 */
export interface Color {

    /**
     * La propiedad code representa el codigo del color.
     *
     * @property code
     * @type {string}
     */
    code: string;

    /**
     * Representa el nombre visible del color.
     *
     * @property name
     * @type {string}
     */
    name: string;

    /**
     * Representa el valor hexadecimal.
     *
     * @property codeName
     * @type {string}
     */
    value: string;

    rotation: number;
}

/**
 * Namespace Colors define un espacio de nombres constantes asociandolos con el objeto Color correspondiente para facilitar su control.
 *
 * @namespace Colors
 */
export namespace Colors {

    /**
     * La constante BLUE representa el color azul de la carta.
     *
     * @const BLUE
     * @type {Color}
     */
    export const BLUE: Color = {name: "Azul", code: "blue", value: "#0000FF", rotation: 180};
    /**
     * La constante RED representa el color rojo de la carta.
     *
     * @const RED
     * @type {Color}
     */
    export const RED: Color = {name: "Rojo", code: "red", value: "#FF0000", rotation: 0};

    /**
     * La constante GREEN representa el color verde de la carta.
     *
     * @const GREEN
     * @type {Color}
     */
    export const GREEN: Color = {name: "Verde", code: "green", value: "#008000", rotation: 90};

    /**
     * La constante YELLOW representa el color amarillo de la carta.
     *
     * @const YELLOW
     * @type {Color}
     */
    export const YELLOW: Color = {name: "Amarillo", code: "yellow", value: "#FFFF00", rotation: 270};

    export const ARRAY: Color[] = [RED, GREEN, BLUE, YELLOW];

    export function getNext(color: Color): Color {
        const index = ARRAY.findIndex(c => c.code === color.code);
        if (index + 1 == ARRAY.length) {
            return ARRAY[0];
        } else {
            return ARRAY[index + 1];
        }
    }

    export function getPrev(color: Color): Color {
        const index = ARRAY.findIndex(c => c.code === color.code);
        if (index == 0) {
            return ARRAY[ARRAY.length - 1];
        } else {
            return ARRAY[index - 1];
        }
    }
}