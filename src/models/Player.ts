
import {Color} from "./Color";

export class Player {

    public id: number;

    public name: string;

    public color: Color;

    public status: PlayerStatus;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.color = null;
        this.status = PlayerStatus.CONNECTED;
    }
}

export enum PlayerStatus {
    CONNECTED,
    DISCONNECTED
}