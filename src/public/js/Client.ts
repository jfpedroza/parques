
import Socket = SocketIOClient.Socket;
import {UIHelper} from "./UIHelper";

export class Client {
    private socket: Socket;
    private ui: UIHelper;

    public constructor() {
        this.ui = new UIHelper(this);
    }

    public connect() {
        let url = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        this.socket = io.connect(url, { forceNew: true });
    }

    public listen() {

        this.socket.on("restart", () => {
            location.reload(true);
        });
    }

    public start() {
        this.connect();
        this.listen();
        this.ui.configureEvents();

        this.ui.setStage(1);
    }
}