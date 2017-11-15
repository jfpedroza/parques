
import {Game, GameStatus} from "../../models/Game";
import {Player} from "../../models/Player";

export class ClientGame implements Game {

    public id: number;

    public name: string;

    public status: GameStatus;

    public creator: Player;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    constructor(game: Game) {
        this.id = game.id;
        this.name = game.name;
        this.status = game.status;
        this.creator = game.creator;
        this.players = game.players;
        this.currentPlayer = null;
        this.winner = null;
    }

    public toGame(): Game {
        return <Game>{
            id: this.id,
            name: this.name,
            status: this.status,
            creator: this.creator,
            players: this.players
        };
    }
}