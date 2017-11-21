
import {Game, GameStatus} from "../../models/Game";
import {Player} from "../../models/Player";
import {Point} from "../../models/Point";
import {Colors} from "../../models/Color";
import {Piece, PiecePositions} from "../../models/Piece";

export class ClientGame extends Game {

    public player: Player;

    public rotation: number;

    public pathPoints: Map<number, Point>; // TODO Put back to private

    public width: number;

    public height: number;

    public scale: number;

    public jailSize: number;

    public pieceRadius: number;

    public centerRadius: number;

    public center: Point;

    constructor(game: Game, player: Player) {
        super();
        this.id = game.id;
        this.name = game.name;
        this.status = game.status;
        this.creator = game.creator;
        this.players = game.players;
        this.currentPlayer = game.currentPlayer;
        this.winner = null;
        this.player = player;
    }

    public update(game: Game, type: string) {
        if (type == 'name') {
            this.name = game.name;
        } else if (type == 'players') {
            this.players = game.players;
            this.creator = game.creator;
        }
    }

    public start(game: Game): void {
        this.status = game.status;
        this.currentPlayer = game.currentPlayer;
        this.rotation = this.player.color.rotation;
        this.players = game.players;
        this.dice = game.dice;
    }

    public setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        const realSize = 1200;
        this.scale = width / realSize;
        this.jailSize = 366 * this.scale;
        this.pieceRadius = 24 * this.scale;
        this.centerRadius = 162 * this.scale;
        this.center = new Point(this.width / 2, this.height / 2);
    }

    public calculatePathPoints() {
        this.pathPoints = new Map();
        const dstart = (this.width - this.jailSize * 2) / 3;
        const xstart = this.width - this.pieceRadius;
        const ystart = this.height - this.pieceRadius;

        const start = new Point(this.center.x + dstart, ystart - this.pieceRadius * 4 * 2);
        const end = new Point(xstart - this.pieceRadius * 4 * 2, this.center.y + dstart);
        const center = new Point(end.x, start.y);

        const points: Point[] = [];

        points.push(new Point(this.width - this.jailSize / 2, this.height - this.jailSize / 2));

        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 5; i++) {
                const point = new Point(this.center.x + dstart, ystart - this.pieceRadius * i * 2);
                point.rotate(this.center, - j * Math.PI / 2);
                points.push(point);
            }


            for (let i = 0; i < 6; i++) {
                const point = Point.copy(start);
                point.rotate(center, (i + 1) * (Math.PI / 2) / 7);
                point.rotate(this.center, - j * Math.PI / 2);
                points.push(point);
            }

            for (let i = 0; i < 5; i++) {
                const point = new Point(xstart - this.pieceRadius * 4 * 2 + this.pieceRadius * i * 2, this.center.y + dstart);
                point.rotate(this.center, - j * Math.PI / 2);
                points.push(point);
            }

            const point = new Point(xstart, this.center.y);
            point.rotate(this.center, - j * Math.PI / 2);
            points.push(point);
        }

        for (let i = 1; i < 8; i++) {
            points.push(new Point(this.center.x, ystart - this.pieceRadius * i * 2));
        }

        points.push(Point.copy(this.center));

        points.forEach((p, i) => this.pathPoints.set(i, p));
    }

    public calculatePiecePositions() {

        /*for (let pos = PiecePositions.JAIL; pos <= PiecePositions.END; pos++) {

        }*/

        for (const player of this.players) {

            {
                const jailPieces = player.pieces.filter(p => p.position == PiecePositions.JAIL);
                const x = this.width - this.jailSize / 2 - jailPieces.length * this.pieceRadius;
                const y = this.height - this.jailSize / 2;

                jailPieces.forEach((piece, i) => {
                    piece.p = new Point(x + i * (this.pieceRadius * 2 + 2), y);
                });
            }

            {
                const endPieces = player.pieces.filter(p => p.position == PiecePositions.END);
                const x = this.width / 2 - endPieces.length * this.pieceRadius;
                const y = this.height / 2 + this.centerRadius * 0.8;

                endPieces.forEach((piece, i) => {
                    piece.p = new Point(x + i * (this.pieceRadius * 2 + 2), y);
                });
            }

            {
                const pieces = player.pieces.filter(p => p.position != PiecePositions.JAIL && p.position != PiecePositions.END);
                pieces.forEach(piece => {
                    piece.p = Point.copy(this.pathPoints.get(piece.position));
                });
            }

            player.pieces.forEach(piece => {
                piece.p.rotate(this.center, (this.rotation - player.color.rotation) * Math.PI / 180);
            });
        }
    }
}