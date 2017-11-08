
import {Game} from "../../models/Game";

export class ClientGame implements Game {

    public id: string;

    constructor(id: string) {
        this.id = id;
    }
}