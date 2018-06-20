
import {Constants, Game, GameStatus} from "./models/Game";
import {Player} from "./models/Player";
import {Colors} from "./models/Color";
import {Server} from "./Server";
import {Piece, PiecePositions, PieceMovement} from "./models/Piece";

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

    private repeat: boolean;

    private allPiecesInJail: boolean;

    private movableJailPieces: number;

    private piecesToMove: Map<number, number[]>[];

    private remainingPiecesToMove: Map<Player, PieceMovement[]>;

    private movedPieces: Set<Piece>;

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

        this.dice = Array(diceCount).fill(1);
        this.enabledDice = diceCount;
        this.movableJailPieces = 0;

        this.tries = new Map();
        this.piecesToMove = [];
        this.remainingPiecesToMove = new Map();
        this.movedPieces = new Set();
        this.players.forEach(player => this.tries.set(player, 0));
    }

    public launchDice(): void {

        const laps = Math.floor(minLaps + (maxLaps - minLaps) * Math.random());

        const turns = this.dice.slice(0, this.enabledDice).map(() => {
            const lapPart = Math.floor(maxImages * Math.random());
            return laps * maxImages + lapPart;
        });

        this.emitAll("do-launch-dice", turns);

        for (let i = 0; i < this.enabledDice; i++) {
            this.dice[i] = 1 + (this.dice[i] - 1 + turns[i]) % maxImages;
        }

        const dice = this.dice.slice(0, this.enabledDice);
        const diceRemaining = dice.reduce((a, b) => a + b);

        this.log(`${this.currentPlayer.name} got [${dice.join(', ')}] = ${diceRemaining}`);

        const same = this.enabledDice == 1 ? false : this.dice.every(dice => dice == this.dice[0]);
        if (same) {
            this.movableJailPieces = this.everyDice(1) || this.everyDice(6) ? pieceCount : 2;
        } else {
            this.movableJailPieces = 0;
        }

        this.repeat = false;
        this.piecesToMove.push(new Map());
        this.movedPieces.clear();
        const piecesInJail = this.currentPlayer.piecesInJail();
        this.allPiecesInJail = this.currentPlayer.allInJail(false);

        if (same) {
            this.repeat = true;
            piecesInJail.forEach(p => this.piecesToMove[0].set(p.id, [PiecePositions.START - PiecePositions.JAIL]));
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
                if (movables.length > 0) {
                    array = [this.dice[0]];
                } else {
                    array = [];
                    this.piecesToMove[0].set(piecesInJail[0].id, [PiecePositions.START - PiecePositions.JAIL]);
                    const piecesToMove2 = new Map<number, number[]>();
                    piecesToMove2.set(piecesInJail[0].id, [this.dice[0]]);
                    this.piecesToMove.push(piecesToMove2);
                }
            } else {
                if (this.enabledDice > 1) {
                    array = [this.dice[0], this.dice[1], this.dice[0] + this.dice[1]];
                } else {
                    array = [this.dice[0]];
                }
            }

            movables.forEach(piece => {
                this.piecesToMove[0].set(piece.id, array.slice());
            });
        }

        if (this.piecesToMove[0].size == 0) {
            this.piecesToMove.splice(0, 1);
        }
    }

    private animationComplete(player: Player) {
        if (this.piecesToMove.length > 0) {
            if (player.id == this.currentPlayer.id) {
                const pieces: any = {};
                this.piecesToMove[0].forEach((movs, pId) => {
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

    public movePiece(movement: PieceMovement): void {
        const player = movement.player;
        const piece = player.pieces.find(piece => piece.id == movement.piece.id);
        movement.piece = piece;
        const mov = movement.mov;
        this.log(`move piece ${piece.id} of ${player.name} ${mov} place(s)`);
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
            if (this.piecesToMove[0].has(piece.id)) {
                let movs = this.piecesToMove[0].get(piece.id);
                const copy = movs.slice();
                for (let i = 0; i < movs.length; i++) {
                    movs[i] -= mov;
                }

                copy.splice(copy.indexOf(mov), 1);
                const min = Math.min(...copy);

                movs = movs.filter(m => m >= min);
                if (movs.length > 0) {
                    this.piecesToMove[0].set(piece.id, movs);
                } else {
                    this.piecesToMove[0].delete(piece.id);
                }
            }
        });

        this.remainingPiecesToMove.clear();
        piece.position = this.calculateNextPosition(piece, mov);
        if (piece.position == PiecePositions.END) {
            this.piecesToMove[0].delete(piece.id);
            this.repeat = true;
        } else {
            const piecesToJail: Map<Player, Piece[]> = new Map();
            if (piece.position == PiecePositions.START || !PiecePositions.SAFES_JAIL.includes(piece.position)) {
                for (const ply of this.players) {
                    if (ply.id != player.id) {
                        let rotation = ply.color.rotation - player.color.rotation;
                        if (rotation < 0) {
                            rotation += 360;
                        }

                        const steps = rotation / 90;
                        let otherPos = piece.position - steps * 17;
                        if (otherPos <= PiecePositions.JAIL) {
                            otherPos += PiecePositions.LAP;
                        }

                        const same = ply.piecesInPosition(otherPos);
                        if (same.length > 0) {
                            piecesToJail.set(ply, same);
                        }
                    }
                }
            }

            if (piecesToJail.size > 0) {
                this.repeat = true;
                this.players.forEach(player => {
                    this.remainingPiecesToMove.set(player, []);
                    piecesToJail.forEach((pieces, ply) => {
                        pieces.forEach(piece => {
                            this.remainingPiecesToMove.get(player).push({
                                player: ply,
                                piece: piece,
                                mov: PiecePositions.JAIL - piece.position
                            });
                        });
                    });
                });

                piecesToJail.forEach(pieces => {
                    pieces.forEach(piece => piece.position = PiecePositions.JAIL);
                });

                if (player.activePieces().length > 1) {
                    this.piecesToMove[0].delete(piece.id);
                }
            }
        }

        if (this.piecesToMove[0].size == 0) {
            this.piecesToMove.splice(0, 1);
        }

        this.movedPieces.add(piece);
        if (this.piecesToMove.length == 0 && this.movedPieces.size > 0) {
            let every = true;
            for (const p of this.movedPieces) {
                if (!PiecePositions.SAFES.includes(p.position)) {
                    every = false;
                    break;
                }
            }

            if (every) {
                this.repeat = true;
            }
        }

        if (player.allAtTheEnd()) {
            this.winner = player;
            this.status = GameStatus.FINISHED;
            this.log(`has finished! Winner: ${this.winner.name}`);
        } else if (this.piecesToMove.length == 0 && !this.repeat && !this.allPiecesInJail) {
            this.currentPlayer = this.getNextPlayer();
        }

        this.emitAll("move-piece", movement);
    }

    public moveAnimationComplete(player: Player): void {
        if (this.remainingPiecesToMove.has(player)) {
            const movement = this.remainingPiecesToMove.get(player).splice(0, 1)[0];
            if (this.remainingPiecesToMove.get(player).length == 0) {
                this.remainingPiecesToMove.delete(player);
            }

            this.emit(player, "move-piece", movement);
        } else {
            this.animationComplete(player);
        }
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