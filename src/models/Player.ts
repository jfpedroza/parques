
import {Color} from "./Color";

export class Player {

    public id: number;

    public name: string;

    public color: Color;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.color = null;
    }
}