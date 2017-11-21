
import {Player} from "./Player";

export abstract class Game {

    id: number;

    name: string;

    status: GameStatus;

    creator: Player;

    players: Player[];

    currentPlayer: Player;

    winner: Player;

    dice: number[];

    public toGame(): Game {
        return <Game>{
            id: this.id,
            name: this.name,
            status: this.status,
            creator: this.creator,
            players: this.players,
            currentPlayer: this.currentPlayer,
            dice: this.dice
        };
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
    export const maxPlayers: number = 5;

    export const pieceCount: number = 4;

    export const diceCount: number = 2;

    export const minLaps: number = 3;

    export const maxLaps: number = 5;

    export const maxImages: number = 6;

    export const maxTries: number = 3;
}