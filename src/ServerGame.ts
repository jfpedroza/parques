
import {Game} from "./models/Game";

export class ServerGame implements Game {

    public id: string;

    constructor(id: string) {
        this.id = id;
    }
}