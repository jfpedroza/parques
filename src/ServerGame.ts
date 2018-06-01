
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

    private repeat: boolean;

    private allPiecesInJail: boolean;

    private movableJailPieces: number;

    constructor(server: Server, creator: Player) {
        super();
        this.server = server;
        this.id = new Date().getTime();
        // this.name = this.id.toString();
        this.name = "Nueva Sala";
        this.created = new Date();
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

        // this.players[0].pieces.forEach((p, i) => p.position = 8);
        // this.players[1].pieces.forEach((p, i) => p.position = 59);
        // this.players[2].pieces.forEach((p, i) => p.position = 42);
        // this.players[3].pieces.forEach((p, i) => p.position = 25);

        this.dice = Array(diceCount).fill(1);
        this.enabledDice = diceCount;
        this.movableJailPieces = 0;

        this.tries = new Map();
        this.players.forEach(player => this.tries.set(player, 0));
    }

    public launchDice(): void {
        const dice = this.dice.slice(0, this.enabledDice);

        const laps = Math.floor(minLaps + (maxLaps - minLaps) * Math.random());

        const turns = dice.map(() => {
            const lapPart = Math.floor(maxImages * Math.random());
            return laps * maxImages + lapPart;
        });

        this.emitAll("do-launch-dice", turns);

        for (let i = 0; i < this.enabledDice; i++) {
            this.dice[i] = 1 + (this.dice[i] - 1 + turns[i]) % maxImages;
        }

        this.diceRemaining = dice.reduce((a, b) => a + b);

        this.log(`${this.currentPlayer.name} got [${dice.join(', ')}] = ${this.diceRemaining}`);

        const same = this.enabledDice == 1 ? false : this.dice.every(dice => dice == this.dice[0]);
        if (same) {
            this.movableJailPieces = this.everyDice(1) || this.everyDice(6) ? pieceCount : 2;
        } else {
            this.movableJailPieces = 0;
        }

        this.repeat = false;
        this.piecesToMove = new Map();
        const piecesInJail = this.currentPlayer.piecesInJail();
        this.allPiecesInJail = this.currentPlayer.allInJail(false);

        if (same) {
            this.repeat = true;
            piecesInJail.forEach(p => this.piecesToMove.set(p.id, [PiecePositions.START - PiecePositions.JAIL]));
        }

        if (this.allPiecesInJail && !same) {
            const tries = this.tries.get(this.currentPlayer) + 1;
            this.tries.set(this.currentPlayer, tries);
            if (tries == maxTries) {
                this.tries.set(this.currentPlayer, 0);
                this.currentPlayer = this.getNextPlayer();
            }
        }

        if ((same && piecesInJail.length <= 1) || (!same && !this.allPiecesInJail)) {

            const movables = this.currentPlayer.activePieces();

            // TODO Make it work for more than 2 dice
            let array: number[];
            if (piecesInJail.length == 1 && same) {
                array = [this.dice[0]];
            } else {
                if (this.enabledDice > 1) {
                    if (movables.length > 1) {
                        array = [this.dice[0], this.dice[1], this.dice[0] + this.dice[1]];
                    } else {
                        array = [this.dice[0] + this.dice[1]];
                    }
                } else {
                    array = [this.dice[0]];
                }
            }

            movables.forEach(piece => {
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

                this.log("pieces to move: ", pieces);
                this.emit(player, "enable-pieces", pieces);
            }
        } else if (this.winner) {
            this.emit(player, "winner", this.winner);
        } else {
            this.enabledDice = diceCount;
            const pieces = this.currentPlayer.pieces;
            const piecesAtTheEnd = this.currentPlayer.piecesAtTheEnd();
            const piecesOneDice = pieces.filter(piece => PiecePositions.END - piece.position <= 6);
            if (piecesAtTheEnd.length == pieceCount - 1 && piecesOneDice.length == pieceCount) {
                this.enabledDice = 1;
            }

            this.emit(player, "current-player", this.currentPlayer, this.enabledDice);
        }
    }

    public diceAnimationComplete(player: Player): void {
        this.animationComplete(player);
    }

    public movePiece(player: Player, p: Piece, mov: number): void {
        const piece = player.pieces.find(piece => piece.id == p.id);
        let pieces: Piece[];
        if (piece.position == PiecePositions.JAIL) {
            this.movableJailPieces--;
            if (this.movableJailPieces > 0) {
                pieces = [piece];
            } else {
                pieces = player.piecesInJail();
            }
        } else {
            pieces = player.activePieces();
        }

        pieces.forEach(piece => {
            if (this.piecesToMove.has(piece.id)) {
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
            }
        });

        piece.position = this.calculateNextPosition(piece, mov);
        if (piece.position == PiecePositions.END) {
            this.piecesToMove.delete(piece.id);
            this.repeat = true;
        }

        if (PiecePositions.SAFES.some(safe => safe == piece.position)) {
            this.repeat = true;
        }

        if (player.allAtTheEnd()) {
            this.winner = player;
            this.status = GameStatus.FINISHED;
            this.log(`has finished! Winner: ${this.winner.name}`);
        } else if (this.piecesToMove.size == 0 && !this.repeat && !this.allPiecesInJail) {
            this.currentPlayer = this.getNextPlayer();
        }

        this.emitAll("move-piece", player, piece, mov);
    }

    public moveAnimationComplete(player: Player): void {
        this.animationComplete(player);
    }

    private getNextPlayer(): Player {
        let player: Player;
        let nextColor = this.currentPlayer.color;
        do {
            nextColor = Colors.getNext(nextColor);
            player = this.players.find(player => player.color.code == nextColor.code);
        } while (!player);

        return player;
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