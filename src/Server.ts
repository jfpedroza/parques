
import Socket = SocketIO.Socket;
import {Player} from "./models/Player";

export class Server {

    private players: Player[];

    public constructor() {
        this.players = [];
        this.players.push(new Player(1, 'jhon'));
        this.players.push(new Player(2, 'kevin'));
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
    }
}