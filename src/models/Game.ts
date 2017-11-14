
import {Player} from "./Player";

export interface Game {

    id: number;

    status: GameStatus;

    players: Player[];

    currentPlayer: Player;

    winner: Player;
}

export enum GameStatus {
    CREATED,
    ONGOING,
    FINISHED
}