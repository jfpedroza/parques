
import {Player} from "./Player";

export interface Game {

    id: number;

    name: string;

    status: GameStatus;

    creator: Player;

    players: Player[];

    currentPlayer: Player;

    winner: Player;

    toGame(): Game;
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
}