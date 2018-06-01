
import {Player} from "./Player";
import {Piece, PiecePositions} from "./Piece";

export abstract class Game {

    id: number;

    name: string;

    created: Date;

    status: GameStatus;

    creator: Player;

    players: Player[];

    currentPlayer: Player;

    winner: Player;

    dice: number[];

    enabledDice: number;

    piecesToMove: Map<number, number[]>;

    public toGame(): Game {
        return <Game>{
            id: this.id,
            name: this.name,
            created: this.created,
            status: this.status,
            creator: this.creator,
            players: this.players,
            currentPlayer: this.currentPlayer,
            dice: this.dice,
            enabledDice: this.enabledDice
        };
    }

    public calculateNextPosition(piece: Piece, mov: number): number {
        if (piece.position + mov > PiecePositions.END) {
            return PiecePositions.END * 2 - mov - piece.position;
        } else {
            return piece.position + mov;
        }
    }

    public abstract movePiece(player: Player, p: Piece, mov: number): void;

    public everyDice(dice: number): boolean {
        return this.dice.every(d => d == dice);
    }

    public log(message: any, ... rest: any[]): void {
        console.log(`Game[${this.id}][${this.name}]: ${message}`, ... rest);
    }
}

export enum GameStatus {
    CREATED,
    ONGOING,
    FINISHED
}

/**
 * Contiene constantes globales en el juego.
 *
 * @namespace Constants
 */
export namespace Constants {

    /**
     * Representa el mínimo de jugadores del juego
     *
     * @const minPlayer
     * @type {number}
     */
    export const minPlayers: number = 2;

    /**
     * Representa el máximo de jugadores del juego
     *
     * @const maxPlayers
     * @type {number}
     */
    export const maxPlayers: number = 4;

    export const pieceCount: number = 4;

    export const diceCount: number = 2;

    export const minLaps: number = 2;

    export const maxLaps: number = 4;

    export const maxImages: number = 6;

    export const maxTries: number = 3;

    export const animationTime: number = 100;

    export const animationDelay: number = 20;
}