
import {Game, GameStatus} from "./models/Game";
import {Player} from "./models/Player";

export class ServerGame implements Game {

    public id: number;

    public status: GameStatus;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    constructor(id: number) {
        this.id = id;
        this.status = GameStatus.CREATED;
        this.players = [];
        this.currentPlayer = null;
        this.winner = null;

        // let map = new Map<Player, number>();

    }


}