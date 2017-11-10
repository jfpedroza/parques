
import Socket = SocketIO.Socket;
import {Player} from "./models/Player";

export class Server {

    private players: Player[];

    public constructor() {
        this.players = [];
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

        socket.on("log-in", (username: string) => {
            let player: Player;
            if (this.players.filter((player) => player.name == username).length == 0) {
                player = new Player(new Date().getTime(), username);
                this.players.push(player);
            }

            socket.emit("log-in", player);
        });
    }
}