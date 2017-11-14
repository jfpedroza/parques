
import {Game, GameStatus} from "../../models/Game";
import {Player} from "../../models/Player";

export class ClientGame implements Game {


    public id: number;

    public status: GameStatus;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    constructor(id: number) {
        this.id = id;
    }
}