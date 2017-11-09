
import Socket = SocketIOClient.Socket;
import {UIHelper} from "./UIHelper";

export class Client {
    private socket: Socket;
    private ui: UIHelper;

    public constructor() {
        this.ui = new UIHelper(this);
    }

    public start() {
        this.connect();
        this.listen();
        this.ui.configureEvents();

        this.ui.setStage(1);
    }

    private connect() {
        const url = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        this.socket = io.connect(url, { forceNew: true });
    }

    private listen() {

        this.socket.on('restart', () => {
            location.reload(true);
        });

        this.socket.on('check-username', (used: boolean) => {
            this.ui.setUsernameUsed(used);
        });
    }

    public checkUsername(username: string) {
        this.socket.emit('check-username', username);
    }
}