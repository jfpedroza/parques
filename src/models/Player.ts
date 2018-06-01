
import {Color} from "./Color";
import {Piece, PiecePositions} from "./Piece";

export class Player {

    public id: number;

    public name: string;

    public color: Color;

    public status: PlayerStatus;

    public pieces: Piece[];

    constructor(player: Player) {
        this.id = player.id;
        this.name = player.name;
        this.color = player.color;
        this.status = player.status ? player.status : PlayerStatus.CONNECTED;
        this.pieces = player.pieces;
    }

    public piecesInPosition(position: number): Piece[] {
        return this.pieces.filter(p => p.position == position);
    }

    public piecesInJail(): Piece[] {
        return this.piecesInPosition(PiecePositions.JAIL);
    }

    public piecesAtTheEnd(): Piece[] {
        return this.piecesInPosition(PiecePositions.END);
    }

    public piecesNotAtTheEnd(): Piece[] {
        return this.pieces.filter(p => p.position != PiecePositions.END);
    }

    public activePieces(): Piece[] {
        return this.pieces.filter(p => p.position != PiecePositions.JAIL && p.position != PiecePositions.END);
    }

    public piecesAfterLap(): Piece[] {
        return this.pieces.filter(p => p.position > PiecePositions.LAP && p.position < PiecePositions.END);
    }

    public allInJail(countPiecesAtEnd: boolean): boolean {
        if (countPiecesAtEnd) {
            return this.pieces.every(p => p.position == PiecePositions.JAIL);
        } else {
            return this.piecesNotAtTheEnd().every(p => p.position == PiecePositions.JAIL);
        }
    }

    public allAtTheEnd(): boolean {
        return this.pieces.every(p => p.position == PiecePositions.END);
    }
}

export enum PlayerStatus {
    CONNECTED,
    DISCONNECTED
}