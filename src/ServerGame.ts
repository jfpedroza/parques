
import {Constants, Game, GameStatus} from "./models/Game";
import {Player} from "./models/Player";
import {Colors} from "./models/Color";
import {Server} from "./Server";
import {Piece, PiecePositions} from "./models/Piece";

import minLaps = Constants.minLaps;
import maxLaps = Constants.maxLaps;
import maxImages = Constants.maxImages;
import maxPlayers = Constants.maxPlayers;
import pieceCount = Constants.pieceCount;
import diceCount = Constants.diceCount;
import maxTries = Constants.maxTries;

export class ServerGame extends Game {

    private server: Server;

    private tries: Map<Player, number>;

    private diceRemaining: number;

    private safe: boolean;

    private allPiecesInJail: boolean;

    constructor(server: Server, creator: Player) {
        super();
        this.server = server;
        this.id = new Date().getTime();
        this.name = this.id.toString();
        this.status = GameStatus.CREATED;
        this.creator = creator;
        this.players = [];
        this.currentPlayer = null;
        this.winner = null;
        this.addPlayer(creator);
    }

    public addPlayer(player: Player): boolean {
        if (this.players.length == maxPlayers) {
            return false;
        }

        for (const color of Colors.ARRAY) {
            if (!this.players.find((p) => p.color.code == color.code)) {
                player.color = color;
                this.players.push(player);
                return true;
            }
        }

        return false;
    }

    public removePlayer(player: Player): void {
        player.color = null;
        this.players.splice(this.players.findIndex((p) => p.id === player.id), 1);
    }

    public start(): void {
        this.status = GameStatus.ONGOING;
        this.currentPlayer = this.players[0];
        for (const player of this.players) {
            player.pieces = [];
            for (let i = 0; i < pieceCount; i++) {
                player.pieces.push(new Piece(i + 1));
            }
        }

        this.dice = Array(diceCount).fill(1);

        this.tries = new Map();
        this.players.forEach(player => this.tries.set(player, 0));
    }

    public launchDice(): void {
        const laps = Math.floor(minLaps + (maxLaps - minLaps) * Math.random());

        const turns = this.dice.map(() => {
            const lapPart = Math.floor(maxImages * Math.random());
            return laps * maxImages + lapPart;
        });

        this.emitAll("do-launch-dice", turns);

        for (let i = 0; i < diceCount; i++) {
            this.dice[i] = 1 + (this.dice[i] - 1 + turns[i]) % maxImages;
        }

        this.diceRemaining = this.dice.reduce((a, b) => a + b);

        console.log(`Game[${this.id}][${this.name}] - ${this.currentPlayer.name} got [${this.dice.join(', ')}] = ${this.diceRemaining}`);

        this.safe = false;
        this.piecesToMove = new Map();
        if (this.allInJail(this.currentPlayer)) {
            this.allPiecesInJail = true;
            const same = this.dice.every(dice => dice == this.dice[0]);

            if (same) {
                this.currentPlayer.pieces.forEach(p => this.piecesToMove.set(p.id, [PiecePositions.START]));
            } else {
                const tries = this.tries.get(this.currentPlayer) + 1;
                this.tries.set(this.currentPlayer, tries);
                if (tries == maxTries) {
                    this.tries.set(this.currentPlayer, 0);
                    this.currentPlayer = this.getNextPlayer();
                }
            }
        } else {
            this.allPiecesInJail = false;
            // TODO Make it work for more than 2 dice
            const array = [this.dice[0], this.dice[1], this.dice[0] + this.dice[1]];

            this.currentPlayer.pieces.filter(p => p.position != PiecePositions.JAIL && p.position != PiecePositions.END)
                .forEach(piece => {
                    this.piecesToMove.set(piece.id, array.slice());
                });
        }
    }

    private animationComplete(player: Player) {
        if (this.piecesToMove.size > 0) {
            if (player.id == this.currentPlayer.id) {
                const pieces: any = {};
                this.piecesToMove.forEach((movs, pId) => {
                    pieces[pId] = movs;
                });

                console.log("Pieces to move: ", pieces);
                this.emit(player, "enable-pieces", pieces);
            }
        } else {
            this.emit(player, "current-player", this.currentPlayer);
        }
    }

    public diceAnimationComplete(player: Player): void {
        this.animationComplete(player);
    }

    public movePiece(player: Player, p: Piece, mov: number): void {
        const piece = player.pieces.find(piece => piece.id == p.id);
        let pieces: Piece[];
        if (this.allPiecesInJail) {
            pieces = [piece];
        } else {
            pieces = player.pieces;
        }

        pieces.forEach(piece => {
            let movs = this.piecesToMove.get(piece.id);
            const copy = movs.slice();
            for (let i = 0; i < movs.length; i++) {
                movs[i] -= mov;
            }

            copy.splice(copy.indexOf(mov), 1);
            const min = Math.min(...copy);

            movs = movs.filter(m => m >= min);
            if (movs.length > 0) {
                this.piecesToMove.set(piece.id, movs);
            } else {
                this.piecesToMove.delete(piece.id);
            }
        });

        piece.position = this.calculateNextPosition(piece, mov);
        if (PiecePositions.SAFES.some(safe => safe == piece.position)) {
            this.safe = true;
        }

        if (this.piecesToMove.size == 0 && !this.safe) {
            this.currentPlayer = this.getNextPlayer();
        }

        this.emitAll("move-piece", player, piece, mov);
    }

    public moveAnimationComplete(player: Player): void {
        this.animationComplete(player);
    }

    private getNextPlayer(): Player {
        const index = this.players.indexOf(this.currentPlayer);
        if (index + 1 == this.players.length) {
            return this.players[0];
        } else {
            return this.players[index + 1];
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
        this.server.getSocket(player).emit(event, ... args);
    }

    /**
     * Envía un mensaje a todos los jugadores conectados
     *
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emitAll(event: string, ... args: any[]) {
        this.players.forEach(p => {
            this.emit(p, event, ... args);
        });
    }

    /**
     * Envía un mensaje a todos los jugadores menos el especificado
     * @param {Player} player El jugador al que no se le enviará un mensaje
     * @param {string} event El mensaje que se quiere enviar
     * @param args Los parámetros del mensaje
     */
    public emitAllBut(player: Player, event: string, ... args: any[]) {
        this.players.forEach(p => {
            if (p.id != player.id) {
                this.emit(p, event, ... args);
            }
        });
    }
}