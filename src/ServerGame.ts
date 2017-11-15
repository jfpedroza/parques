
import {Constants, Game, GameStatus} from "./models/Game";
import {Player} from "./models/Player";
import {Colors} from "./models/Color";

export class ServerGame implements Game {

    public id: number;

    public name: string;

    public status: GameStatus;

    public creator: Player;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    constructor(creator: Player) {
        this.id = new Date().getTime();
        this.name = this.id.toString();
        this.status = GameStatus.CREATED;
        this.creator = creator;
        this.players = [];
        this.currentPlayer = null;
        this.winner = null;
        this.addPlayer(creator);
    }

    public addPlayer(player: Player): boolean {
        if (this.players.length == Constants.maxPlayers) {
            return false;
        }

        for (const color of Colors.ARRAY) {
            if (!this.players.find((p) => p.color.code == color.code)) {
                player.color = color;
                this.players.push(player);
                return true;
            }
        }

        return false;
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