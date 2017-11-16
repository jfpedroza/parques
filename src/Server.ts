
import Socket = SocketIO.Socket;
import {Player} from "./models/Player";
import {ServerGame} from "./ServerGame";
import {Game, GameStatus} from "./models/Game";

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
            let game: Game;

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
                const nonFinished = this.getGames(player).filter(g => g.status != GameStatus.FINISHED);
                if (nonFinished.length > 0) {
                    game = nonFinished[0].toGame();
                }
            } else {
                console.log(`${ply} tried to log in`);
            }

            socket.emit("log-in", player, game);
        });

        socket.on("log-out", (player: Player) => {
            console.log(`${player.name} has logged out`);
            this.removePlayer(player);
        });

        socket.on("create-room", (ply: Player) => {
            const player = this.getPlayer(ply.id);
            const game = new ServerGame(player);
            this.games.push(game);
            console.log(`New room[${game.id}] created by ${player.name}`);

            socket.emit("room-creation", game.toGame(), player.color);
        });

        socket.on("update-room-name", (g: Game) => {
            const game = this.getGame(g.id);
            console.log(`Room[${game.id}] name was changed: ${game.name} -> ${g.name}`);
            game.name = g.name;
        });

        socket.on("new-rooms-list", () => {
            socket.emit("new-rooms-list", this.getGamesByStatus(GameStatus.CREATED).map(g => g.toGame()));
        });

        socket.on("join-room", (ply: Player, roomId: number) => {
            const player = this.getPlayer(ply.id);
            const game = this.getGame(roomId);
            let errorMessage: string = null;
            let error = false;
            if (game.status != GameStatus.CREATED) {
                errorMessage = "El juego ya fue iniciado en esta sala.";
                error = true;
            } else {
                if (game.addPlayer(player)) {
                    console.log(`${player.name} has joined to room[${game.id}][${game.name}]`);
                } else {
                    errorMessage = "Se ha alcanzado el máximo de jugadores";
                    error = true;
                }
            }

            if (!error) {
                socket.emit("room-joining", game.toGame(), errorMessage, player.color);
            } else {
                socket.emit("room-joining", null, errorMessage);
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

    public getGames(player: Player): ServerGame[] {
        return this.games.filter(g => g.players.find(p => p.id == player.id));
    }

    public getGamesByStatus(status: GameStatus): ServerGame[] {
        return this.games.filter(g => g.status == status);
    }
}