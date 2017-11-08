
import Socket = SocketIO.Socket;

export class Server {

    public constructor() {

    }

    public onConnection(socket: Socket) {
        console.log("A new client has connected");

        socket.on("disconnect", () => {
            console.log("A client has disconnected");
        });
    }
}