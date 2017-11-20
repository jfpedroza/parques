
import {Game, GameStatus} from "../../models/Game";
import {Player} from "../../models/Player";
import {Point} from "../../models/Point";
import {Colors} from "../../models/Color";
import {PiecePositions} from "../../models/Piece";

export class ClientGame implements Game {

    public id: number;

    public name: string;

    public status: GameStatus;

    public creator: Player;

    public players: Player[];

    public currentPlayer: Player;

    public winner: Player;

    public player: Player;

    public rotation: number;

    private pathPoints: Map<number, Point>;

    public width: number;

    public height: number;

    public scale: number;

    public jailSize: number;

    public pieceRadius: number;

    public centerRadius: number;

    public center: Point;

    constructor(game: Game, player: Player) {
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
    }

    public toGame(): Game {
        return <Game>{
            id: this.id,
            name: this.name,
            status: this.status,
            creator: this.creator,
            players: this.players,
            currentPlayer: this.currentPlayer
        };
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

        const points: Point[] = [];

        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 5; i++) {
                const point = new Point(this.center.x + dstart, ystart - this.pieceRadius * i * 2);
                point.rotate(this.center, - j * Math.PI / 2);
                points.push(point);
            }

            const start = Point.copy(points[points.length - 1]);
            const end = new Point(xstart - this.pieceRadius * 4 * 2, this.center.y + dstart);
            const center = new Point(end.x, start.y);

            for (let i = 0; i < 6; i++) {
                start.rotate(center, (Math.PI / 2) / 7);
                const point = Point.copy(start);
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

        points.forEach((p, i) => this.pathPoints.set(i + 1, p));
    }

    public calculatePiecePositions() {

        for (const player of this.players) {

            {
                const jailPieces = player.pieces.filter(p => p.position == PiecePositions.JAIL);
                const x = this.width - this.jailSize / 2 - jailPieces.length * this.pieceRadius;
                const y = this.height - this.jailSize / 2;

                jailPieces.forEach((piece, i) => {
                    piece.p.x = x + i * (this.pieceRadius * 2 + 2);
                    piece.p.y = y;
                });
            }

            {
                const endPieces = player.pieces.filter(p => p.position == PiecePositions.END);
                const x = this.width / 2 - endPieces.length * this.pieceRadius;
                const y = this.height / 2 + this.centerRadius * 0.8;

                endPieces.forEach((piece, i) => {
                    piece.p.x = x + i * (this.pieceRadius * 2 + 2);
                    piece.p.y = y;
                });
            }

            {
                const pieces = player.pieces.filter(p => p.position != PiecePositions.JAIL && p.position != PiecePositions.END);
                pieces.forEach(piece => {
                    piece.p = Point.copy(this.pathPoints.get(piece.position));
                });
            }
        }
    }
}