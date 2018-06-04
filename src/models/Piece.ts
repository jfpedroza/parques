
import {Point} from "./Point";
import { Player } from "./Player";

export class Piece {

    public id: number;

    public position: number;

    public p: Point;

    public radius: number;

    public constructor(id: number) {
        this.id = id;
        this.position = PiecePositions.JAIL;
        this.p = new Point();
        this.radius = 0;
    }
}

export interface PieceMovement {

    player: Player;

    piece: Piece;

    mov: number;
}

export namespace PiecePositions {

    export const JAIL = 0;
    export const START = 5;
    export const LAP = 68;
    export const END = 76;
    export const SAFES = [12, 17, 29, 34, 46, 51, 63, 68];
    export const SAFES_JAIL = [12, 17, 22, 29, 34, 39, 46, 51, 56, 63, 68];
}