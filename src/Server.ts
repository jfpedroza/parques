
import Socket = SocketIO.Socket;
import {Player, PlayerStatus} from "./models/Player";
import {ServerGame} from "./ServerGame";
import {Constants, Game, GameStatus} from "./models/Game";
import {Piece} from "./models/Piece";
import {isNumeric} from "tslint";

export class Server {

    private players: Player[];

    private sockets: Map<Player, Socket>;

    private games: ServerGame[];

    private registeredPlayers: Player[];

    private adminSockets: Set<Socket>;

    public constructor() {
        this.players = [];
        this.games = [];
        this.sockets = new Map<Player, Socket>();
        this.registeredPlayers = [];
        this.adminSockets = new Set();
    }

    public onConnection(socket: Socket) {
        console.log(`A new client has connected. IP = ${socket.conn.remoteAddress}`);

        let player: Player = null;

        socket.on("disconnect", () => {
            if (player != null) {
                this.unregisterPlayer(player);
                player.status = PlayerStatus.DISCONNECTED;
                console.log(`${player.name} has disconnected`);
                // TODO Notify other players in the room about disconnection and connection
                this.emitAdmins('update-player', player);
            } else if (this.adminSockets.has(socket)) {
                this.adminSockets.delete(socket);
                console.log("An admin has disconnected");
            } else {
                console.log("A client has disconnected");
            }
        });

        socket.on("check-username", (username: string) => {
            const used = this.players.filter((p) => p.name == username && p.status == PlayerStatus.CONNECTED).length > 0;
            socket.emit("check-username", used);
        });

        socket.on("log-in", (id: number, name: string) => {
            let game: Game;
            player = null;

            if (id === null) {
                console.log(`Trying to log in with name=${name}`);
                player = this.players.find((p) => p.name == name);
                if (!player) {
                    player = new Player(new Date().getTime(), name);
                    this.players.push(player);
                    this.emitAdmins('add-player', player);
                } else if (player.status == PlayerStatus.CONNECTED) {
                    player = null;
                }
            } else {
                console.log(`Trying to log in with id=${id}`);
                player = this.getPlayer(id);
                if (player) {
                    if (player.status == PlayerStatus.DISCONNECTED) {
                        player.status = PlayerStatus.CONNECTED;
                        this.emitAdmins('update-player', player);
                    } else {
                        player = null;
                    }
                }
            }

            if (player) {
                this.sockets.set(player, socket);
                console.log(`${player.name} has logged in`);
                const nonFinished = this.getGames(player).filter(g => g.status != GameStatus.FINISHED);
                if (nonFinished.length > 0) {
                    game = nonFinished[0].toGame();
                }
            } else {
                console.log(`Log-in failed: id=${id}, name=${name}`);
            }

            socket.emit("log-in", player, game);
        });

        socket.on("log-out", () => {
            this.removePlayer(player);
            this.unregisterPlayer(player);
            this.sockets.delete(player);
            const nonFinished = this.getGames(player).filter(g => g.status != GameStatus.FINISHED);
            nonFinished.forEach((game) => {
                this.leaveRoom(player, game);
            });

            console.log(`${player.name} has logged out`);
            this.emitAdmins('delete-player', player);
        });

        socket.on("create-room", () => {
            const game = new ServerGame(this, player);
            this.games.push(game);
            console.log(`New room[${game.id}] created by ${player.name}`);

            socket.emit("room-creation", game.toGame(), player.color);
            this.unregisterPlayer(player);
            this.emitAll(this.registeredPlayers, "new-room", game.toGame());
            this.emitAdmins('add-game', game.toGame());
        });

        socket.on("update-room-name", (g: Game) => {
            const game = this.getGame(g.id);
            console.log(`Room[${game.id}] name was changed: ${game.name} -> ${g.name}`);
            game.name = g.name;
            game.emitAllBut(player, "update-room", game.toGame(), "name");
            this.emitAll(this.registeredPlayers, "update-room", game.toGame(), "name");
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("new-rooms-list", () => {
            const games = this.getGamesByStatus(GameStatus.CREATED).filter(g => g.players.length < Constants.maxPlayers).map(g => g.toGame());
            socket.emit("new-rooms-list", games);
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
                        this.emitAll(this.registeredPlayers, "delete-room", game.toGame());
                    }

                    this.emitAdmins('update-game', game.toGame());
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

        socket.on("leave-room", (gameId: number) => {
            const game = this.getGame(gameId);
            this.leaveRoom(player, game);
        });

        socket.on("start-game", (gameId: number) => {
            const game = this.getGame(gameId);
            game.start();
            console.log(`Game[${game.id}][${game.name}] has started!`);
            game.emitAll("start-game", game.toGame());
            this.emitAll(this.registeredPlayers, "delete-room", game.toGame());
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("launch-dice", (gameId: number) => {
            const game = this.getGame(gameId);
            game.launchDice();
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("dice-animation-complete", (gameId: number) => {
            const game = this.getGame(gameId);
            game.diceAnimationComplete(player);
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("move-piece", (gameId: number, piece: Piece, mov: number) => {
            const game = this.getGame(gameId);
            game.movePiece(player, piece, mov);
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("move-animation-complete", (gameId: number) => {
            const game = this.getGame(gameId);
            game.moveAnimationComplete(player);
            this.emitAdmins('update-game', game.toGame());
        });

        socket.on("register-admin", () => {
            if (!this.adminSockets.has(socket)) {
                this.adminSockets.add(socket);
                console.log("An admin has registered");
            }

            socket.emit("game-list", this.games.map(game => game.toGame()));
            socket.emit("player-list", this.players);
        });

        socket.on("get-game", (gameId: number) => {
            const game = this.getGame(gameId);
            if (game) {
                socket.emit('update-game', game.toGame());
            } else {
                socket.emit('update-game');
            }
        });

        socket.on("request-data", (gameId: number, player: Player, message: string) => {
            const game = this.getGame(gameId);
            player = game.players.find(p => p.id == player.id);
            console.log(`Requesting data to player '${player.name} of game ${gameId}, message=${message}`);
            game.emit(player, "request-data", message);
        });

        socket.on("requested-data", (gameId: number, message: string, data: any) => {
            console.log(`Received requested data for game ${gameId}, message=${message}`);
            this.emitAdmins("requested-data", gameId, message, data);
        });

        socket.on("restart", (player: Player) => {
            player = this.getPlayer(player.id);
            if (player) {
                console.log(`Restarting player ${player.name}`);
                this.emit(player, "restart");
            }
        });

        socket.on("restart-all", () => {
            console.log(`Restarting all the players`);
            this.emitAll(this.players, "restart");
        });

        socket.on("delete-player", (player: Player) => {
            player = this.getPlayer(player.id);
            if (player) {
                this.removePlayer(player);
                this.unregisterPlayer(player);
                this.sockets.delete(player);
                const nonFinished = this.getGames(player).filter(g => g.status != GameStatus.FINISHED);
                nonFinished.forEach((game) => {
                    this.leaveRoom(player, game);
                });

                console.log(`Player ${player.name} has been deleted`);
                this.emitAdmins('delete-player', player);
            }
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

    public removeGame(game: ServerGame): void {
        this.games.splice(this.games.findIndex((g) => g.id === game.id), 1);
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

    private leaveRoom(player: Player, game: ServerGame) {
        game.removePlayer(player);
        console.log(`${player.name} left room[${game.id}][${game.name}]`);
        if (game.players.length > 0) {
            if (game.creator.id == player.id) {
                game.creator = game.players[0];
                console.log(`Creator rights have passed to ${game.creator.name}`);
            }

            game.emitAll("update-room", game.toGame(), "players");
            if (game.players.length + 1 == Constants.maxPlayers) {
                this.emitAll(this.registeredPlayers, "new-room", game.toGame());
            } else {
                this.emitAll(this.registeredPlayers, "update-room", game.toGame(), "players");
            }
            this.emitAdmins('update-game', game.toGame());
        } else {
            this.removeGame(game);
            console.log(`Room[${game.id}][${game.name}] has 0 players, deleted`);
            this.emitAll(this.registeredPlayers, "delete-room", game.toGame());
            this.emitAdmins('delete-game', game.toGame());
        }
    }

    private registerPlayer(player: Player): void {
        if (player) {
            const index = this.registeredPlayers.findIndex((p) => p.id === player.id);
            if (index == -1) {
                this.registeredPlayers.push(player);
            }
        }
    }

    private unregisterPlayer(player: Player): void {
        if (player) {
            const index = this.registeredPlayers.findIndex((p) => p.id === player.id);
            if (index >= 0) {
                this.registeredPlayers.splice(index, 1);
            }
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

    public emitAdmins(event: string, ... args: any[]) {
        this.adminSockets.forEach(socket => {
            socket.emit(event, ... args);
        });
    }
}