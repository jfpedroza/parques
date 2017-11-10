
import Socket = SocketIOClient.Socket;
import {UIHelper} from "./UIHelper";
import {Player} from "../../models/Player";

export class Client {
    private socket: Socket;
    private ui: UIHelper;
    private player: Player;

    public constructor() {
        this.ui = new UIHelper(this);
        this.player = null;
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

        this.socket.on('log-in', (player: Player) => {
            if (player) {
                this.player = player;
                this.ui.setStage(3);
            } else {
                this.ui.setUsernameUsed(true, 'El nombre de usuario se encuentra ocupado');
            }
        })
    }

    public checkUsername(username: string) {
        this.socket.emit('check-username', username);
    }

    public tryLogIn(username: string) {
        this.socket.emit('log-in', username);
    }
}