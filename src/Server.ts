
import Socket = SocketIO.Socket;
import {Player} from "./models/Player";
import {ServerGame} from "./ServerGame";
import {Constants, Game, GameStatus} from "./models/Game";

export class Server {

    private players: Player[];

    private sockets: Map<Player, Socket>;

    private games: ServerGame[];

    private registeredPlayers: Player[];

    public constructor() {
        this.players = [];
        this.games = [];
        this.sockets = new Map<Player, Socket>();
        this.registeredPlayers = [];
    }

    public onConnection(socket: Socket) {
        console.log("A new client has connected");
        let player: Player = null;

        socket.on("disconnect", () => {
            if (player != null) {
                this.unregisterPlayer(player);
                console.log(`${player.name} has disconnected`);
            } else {
                console.log("A client has disconnected");
            }
        });

        socket.on("check-username", (username: string) => {
            const used = this.players.filter((p) => p.name == username).length > 0;
            socket.emit("check-username", used);
        });

        socket.on("log-in", (ply: string) => {
            let game: Game;
            player = null;

            const id = parseInt(ply);
            if (isNaN(id)) {
                if (!this.players.find((p) => p.name == ply)) {
                    player = new Player(new Date().getTime(), ply);
                    this.players.push(player);
                }
            } else {
                player = this.getPlayer(id);
            }

            if (player) {
                this.sockets.set(player, socket);
                console.log(`${player.name} has logged in`);
                const nonFinished = this.getGames(player).filter(g => g.status != GameStatus.FINISHED);
                if (nonFinished.length > 0) {
                    game = nonFinished[0].toGame();
                }
            } else {
                console.log(`${ply} tried to log in`);
            }

            socket.emit("log-in", player, game);
        });

        socket.on("log-out", () => {
            this.removePlayer(player);
            this.unregisterPlayer(player);
            this.sockets.delete(player);
            console.log(`${player.name} has logged out`);
            player = null;
        });

        socket.on("create-room", () => {
            const game = new ServerGame(this, player);
            this.games.push(game);
            console.log(`New room[${game.id}] created by ${player.name}`);

            socket.emit("room-creation", game.toGame(), player.color);
            this.unregisterPlayer(player);
            this.emitAll(this.registeredPlayers, "new-room", game.toGame());
        });

        socket.on("update-room-name", (g: Game) => {
            const game = this.getGame(g.id);
            console.log(`Room[${game.id}] name was changed: ${game.name} -> ${g.name}`);
            game.name = g.name;
            game.emitAllBut(player, "update-room", game.toGame(), "name");
            this.emitAll(this.registeredPlayers, "update-room", game.toGame(), "name");
        });

        socket.on("new-rooms-list", () => {
            socket.emit("new-rooms-list", this.getGamesByStatus(GameStatus.CREATED).map(g => g.toGame()));
        });

        socket.on("join-room", (roomId: number) => {
            const game = this.getGame(roomId);
            let errorMessage: string = null;
            let error = false;
            if (game.status != GameStatus.CREATED) {
                errorMessage = "El juego ya fue iniciado en esta sala.";
                error = true;
            } else {
                if (game.addPlayer(player)) {
                    console.log(`${player.name} has joined to room[${game.id}][${game.name}]`);
                    game.emitAllBut(player, "update-room", game.toGame(), "players");
                    this.unregisterPlayer(player);
                    if (game.players.length < Constants.maxPlayers) {
                        this.emitAll(this.registeredPlayers, "update-room", game.toGame(), "players");
                    } else {
                        // TODO Max players or no players
                    }
                } else {
                    errorMessage = "Se ha alcanzado el máximo de jugadores";
                    error = true;
                }
            }

            if (!error) {
                socket.emit("room-joining", game.toGame(), null, player.color);
            } else {
                socket.emit("room-joining", null, errorMessage);
            }
        });

        socket.on("subscribe-for-room-changes", () => {
            this.registerPlayer(player);
        });

        socket.on("unsubscribe-for-room-changes", () => {
            this.unregisterPlayer(player);
        });
    }

    public getPlayer(id: number): Player {
        return this.players.find(p => p.id == id);
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

    public getGame(id: number): ServerGame {
        return this.games.find(g => g.id == id);
    }

    public getGames(player: Player): ServerGame[] {
        return this.games.filter(g => g.players.find(p => p.id == player.id));
    }

    public getGamesByStatus(status: GameStatus): ServerGame[] {
        return this.games.filter(g => g.status == status);
    }

    public getSocket(player: Player): Socket {
        return this.sockets.get(player);
    }

    private registerPlayer(player: Player): void {
        const index = this.registeredPlayers.findIndex((p) => p.id === player.id);
        if (index == -1) {
            this.registeredPlayers.push(player);
        }
    }

    private unregisterPlayer(player: Player): void {
        const index = this.registeredPlayers.findIndex((p) => p.id === player.id);
        if (index >= 0) {
            this.registeredPlayers.splice(index, 1);
        }
    }

    /**
     * Envía un mensaje al jugador que reciba como parámetro.
     *
     * @param {Player} player El jugador al que se le quiere enviar un mensaje.
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emit(player: Player, event: string, ... args: any[]) {
        this.getSocket(player).emit(event, ... args);
    }

    /**
     * Envía un mensaje a todos los jugadores de un array
     *
     * @param players Array de jugadores al que enviar el mensaje
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emitAll(players: Player[], event: string, ... args: any[]) {
        players.forEach(p => {
            this.emit(p, event, ... args);
        });
    }

}