
import Socket = SocketIO.Socket;
import {Player} from "./models/Player";
import {ServerGame} from "./ServerGame";

export class Server {

    private players: Player[];
    private games: ServerGame[];

    public constructor() {
        this.players = [];
        this.games = [];
    }

    public onConnection(socket: Socket) {
        console.log("A new client has connected");

        socket.on("disconnect", () => {
            console.log("A client has disconnected");
        });

        socket.on("check-username", (username: string) => {
            const used = this.players.filter((player) => player.name == username).length > 0;
            socket.emit("check-username", used);
        });

        socket.on("log-in", (ply: string) => {
            let player: Player;
            const id = parseInt(ply);
            if (isNaN(id)) {
                if (!this.players.find((player) => player.name == ply)) {
                    player = new Player(new Date().getTime(), ply);
                    this.players.push(player);
                }
            } else {
                player = this.getPlayer(id);
            }

            if (player) {
                console.log(`${player.name} has logged in`);
            }

            socket.emit("log-in", player);
        });

        socket.on("log-out", (player: Player) => {

            console.log(`${player.name} has logged out`);
            this.removePlayer(player);
        });
    }

    public getPlayer(id: number): Player {
        const result = this.players.filter(p => p.id == id);
        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    }

    public removePlayer(ply: number|Player) {
        let id: number;
        if (typeof ply === "number") {
            id = ply;
        } else {
            id = ply.id;
        }

        this.players.splice(this.players.findIndex((p) => p.id === id), 1);
    }
}