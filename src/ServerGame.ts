
import {Constants, Game, GameStatus} from "./models/Game";
import {Player} from "./models/Player";
import {Colors} from "./models/Color";
import {Server} from "./Server";

export class ServerGame implements Game {

    private server: Server;

    public id: number;

    public name: string;

    public status: GameStatus;

    public creator: Player;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    constructor(server: Server, creator: Player) {
        this.server = server;
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

    /**
     * Envía un mensaje al jugador que reciba como parámetro.
     *
     * @param {Player} player El jugador al que se le quiere enviar un mensaje.
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emit(player: Player, event: string, ... args: any[]) {
        this.server.getSocket(player).emit(event, ... args);
    }

    /**
     * Envía un mensaje a todos los jugadores conectados
     *
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emitAll(event: string, ... args: any[]) {
        this.players.forEach(p => {
            this.emit(p, event, ... args);
        });
    }

    /**
     * Envía un mensaje a todos los jugadores menos el especificado
     * @param {Player} player El jugador al que no se le enviará un mensaje
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emitAllBut(player: Player, event: string, ... args: any[]) {
        this.players.forEach(p => {
            if (p.id != player.id) {
                this.emit(p, event, ... args);
            }
        });
    }
}