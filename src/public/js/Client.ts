
import Socket = SocketIOClient.Socket;
import {UIHelper} from "./UIHelper";
import {Player} from "../../models/Player";
import {Cookies} from "./Cookies";
import {Game, GameStatus} from "../../models/Game";
import {ClientGame} from "./ClientGame";
import {Color} from "../../models/Color";

export class Client {
    private socket: Socket;
    private ui: UIHelper;
    public player: Player;
    public game: ClientGame;
    public newRooms: ClientGame[];

    public constructor() {
        this.ui = new UIHelper(this);
        this.player = null;
        this.game = null;
        this.newRooms = null;
    }

    public start(): void {
        this.connect();
        this.listen();
        this.ui.configureEvents();

        const playerId = Cookies.get('player-id');
        if (playerId) {
            this.tryLogIn(playerId);
        } else {
            this.ui.setStage(1);
        }
    }

    private connect(): void {
        const url = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        this.socket = io.connect(url, { forceNew: true });
    }

    private listen(): void {

        this.socket.on('restart', () => {
            location.reload(true);
        });

        this.socket.on('check-username', (used: boolean) => {
            this.ui.setLoading(false);
            this.ui.setUsernameUsed(used);
        });

        this.socket.on('log-in', (player: Player, game: Game) => {
            if (player) {
                this.player = player;
                Cookies.set('player-id', player.id.toString(), 1);

                if (game) {
                    this.game = new ClientGame(game);
                    if (this.game.status == GameStatus.CREATED) {
                        this.ui.setStage(4);   
                    } else if (this.game.status == GameStatus.ONGOING) {
                        this.ui.setStage(5);
                    }
                } else {
                    this.ui.setStage(3);
                }
            } else {
                const byCookie = Cookies.get('player-id') != null;
                Cookies.remove('player-id');
                console.log("Couldn't log in, by Cookie: " + byCookie);
                if (byCookie) {
                    this.ui.setStage(1, () => {
                        this.ui.setLoading(false);
                    });
                } else {
                    this.ui.setStage(2, () => {
                        this.ui.setUsernameUsed(true, 'El nombre de usuario se encuentra ocupado');
                    });
                }
            }
        });

        this.socket.on('room-creation', (game: Game, color: Color) => {
            this.game = new ClientGame(game);
            this.player.color = color;
            this.ui.setStage(4);
        });

        this.socket.on('new-rooms-list', (games: Game[]) => {
            this.newRooms = games.map(g => new ClientGame(g));
            this.ui.renderRoomList();
        });

        this.socket.on('room-joining', (game: Game, error: string, color: Color) => {
            if (game) {
                this.game = new ClientGame(game);
                this.player.color = color;
                this.ui.setStage(4);
            } else {
                alert(error);
            }
        });

        this.socket.on('update-room', (game: Game, type: string) => {
            let room: ClientGame = null;
            if (this.game != null && this.game.id == game.id) {
                if (type == 'name') {
                    this.game.name = game.name;
                } else if (type == 'players') {
                    this.game.players = game.players;
                }

                room = this.game;
            } else {
                // TODO
            }

            if (room) {
                this.ui.updateRoom(room, type);
            }
        });
    }

    public checkUsername(username: string): void {
        this.socket.emit('check-username', username);
    }

    public tryLogIn(ply: string|number): void {
        console.log('Trying to log in: ' + ply);
        this.socket.emit('log-in', ply);
    }

    public logOut(): void {
        this.socket.emit('log-out');
        Cookies.remove('player-id');
        location.reload(true);
    }

    public newRoom(): void {
        this.socket.emit('create-room');
    }

    public updateRoomName(name: string): void {
        this.game.name = name;
        this.socket.emit('update-room-name', this.game.toGame());
    }

    public loadRoomList(): void {
        this.socket.emit('new-rooms-list');
    }

    public joinRoom(roomId: number): void {
        this.socket.emit('join-room', roomId);
    }
}