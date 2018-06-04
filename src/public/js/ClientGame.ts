
import {Game, GameStatus, Constants} from "../../models/Game";
import {Player} from "../../models/Player";
import {Point} from "../../models/Point";
import {Colors} from "../../models/Color";
import {Piece, PiecePositions, PieceMovement} from "../../models/Piece";

export class ClientGame extends Game {

    public player: Player;

    public rotation: number;

    public pathPoints: Map<number, Point>; // TODO Put back to private

    public width: number;

    public height: number;

    public scale: number;

    public jailSize: number;

    public pieceRadius: number;

    public smallPieceRadius: number;

    public centerRadius: number;

    public center: Point;

    constructor(game: Game, player: Player) {
        super();
        this.id = game.id;
        this.name = game.name;
        this.created = game.created;
        this.status = game.status;
        this.creator = game.creator;
        this.players = game.players;
        this.currentPlayer = game.currentPlayer;
        this.winner = null;
        this.player = player;
    }

    public update(game: Game, type: string): void {
        if (type == 'name') {
            this.name = game.name;
        } else if (type == 'players') {
            this.players = game.players;
            this.creator = game.creator;
        }
    }

    public start(game: Game): void {
        this.status = game.status;
        this.players = game.players.map(player => new Player(player));
        this.currentPlayer = this.players.find(p => p.id == game.currentPlayer.id);
        this.rotation = this.player.color.rotation;
        this.dice = game.dice;
        this.enabledDice = game.enabledDice;
    }

    public setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        const realSize = 1200;
        this.scale = width / realSize;
        this.jailSize = 366 * this.scale;
        this.pieceRadius = 24 * this.scale;
        this.smallPieceRadius = 19.5 * this.scale;
        this.centerRadius = 162 * this.scale;
        this.center = new Point(this.width / 2, this.height / 2);
    }

    public calculatePathPoints(): void {
        this.pathPoints = new Map();
        const dstart = (this.width - this.jailSize * 2) / 3;
        const xstart = this.width - this.pieceRadius;
        const ystart = this.height - this.pieceRadius;

        const start = new Point(this.center.x + dstart, ystart - (this.pieceRadius * 2 + 1) * 4);
        const end = new Point(xstart - (this.pieceRadius * 2 + 1) * 4, this.center.y + dstart);
        const center = new Point(end.x, start.y);

        const points: Point[] = [];

        points.push(new Point(this.width - this.jailSize / 2, this.height - this.jailSize / 2));

        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 5; i++) {
                const point = new Point(this.center.x + dstart, ystart - (this.pieceRadius * 2 + 1) * i);
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
                const point = new Point(xstart - (this.pieceRadius * 2 + 1) * 4 + (this.pieceRadius * 2 + 1) * i, this.center.y + dstart, -Math.PI / 2);
                point.rotate(this.center, - j * Math.PI / 2);
                points.push(point);
            }

            const point = new Point(xstart, this.center.y, -Math.PI / 2);
            point.rotate(this.center, - j * Math.PI / 2);
            points.push(point);
        }

        for (let i = 1; i < 8; i++) {
            points.push(new Point(this.center.x, ystart - (this.pieceRadius * 2 + 1) * i));
        }

        const lastPoint = Point.copy(this.center);
        lastPoint.y += this.centerRadius * 0.8;
        points.push(lastPoint);

        points.forEach((p, i) => this.pathPoints.set(i, p));
    }

    public validatePathPoints(): Map<number, Point> {
        this.log(`validating path points...`);
        const invalidPathPoints = new Map<number, Point>();
        this.pathPoints.forEach((point, pos) => {
            if (point.x < 0 || point.x >= this.width) {
                this.log(`invalid path point: pos=${pos} point=(${point.x}, ${point.y}, ${point.dir})`);
                invalidPathPoints.set(pos, point);
            } else if (point.y < 0 || point.y >= this.height) {
                this.log(`invalid path point: pos=${pos} point=(${point.x}, ${point.y}, ${point.dir})`);
                invalidPathPoints.set(pos, point);
            } else if (isNaN(point.dir)) {
                this.log(`invalid path point: pos=${pos} point=(${point.x}, ${point.y}, ${point.dir})`);
                invalidPathPoints.set(pos, point);
            }
        });

        this.log(`validation finished.`);
        return invalidPathPoints;
    }

    public calculatePiecePositions(): void {

        for (const player of this.players) {

            const positions = [PiecePositions.JAIL];
            for (let i = PiecePositions.LAP + 1; i <= PiecePositions.END; i++) {
                positions.push(i);
            }

            positions.forEach(position => {
                const pieces = player.piecesInPosition(position);
                const radius = pieces.length == Constants.pieceCount ? this.smallPieceRadius : this.pieceRadius;
                const point = this.pathPoints.get(position);
                const x = point.x - (pieces.length - 1) * radius;
                const y = point.y;

                pieces.forEach((piece, i) => {
                    piece.radius = radius;
                    piece.p = new Point(x + i * (radius * 2 + 1), y);
                    piece.p.rotate(this.center, (this.rotation - player.color.rotation) * Math.PI / 180);
                });
            });
        }

        for (let pos = PiecePositions.JAIL + 1; pos <= PiecePositions.LAP; pos++) {
            const samePositions: Map<Player, Piece[]> = new Map();
            this.players.forEach(player => {
                let rotation = player.color.rotation - this.rotation;
                if (rotation < 0) {
                    rotation += 360;
                }

                const steps = rotation / 90;
                let otherPos = pos - steps * 17;
                if (otherPos <= PiecePositions.JAIL) {
                    otherPos += PiecePositions.LAP;
                }

                const same = player.piecesInPosition(otherPos);
                if (same.length > 0) {
                    samePositions.set(player, same);
                }
            });

            const pieces: Array<Array<Piece>> = [];
            const piecePlayers: Array<Player> = [];
            const maxSize = Constants.pieceCount;
            let left, j = 0;
            do {
                left = false;
                for (const player of samePositions.keys()) {
                    if (samePositions.get(player).length > 0) {
                        const piece = samePositions.get(player).splice(0, 1)[0];
                        if (samePositions.get(player).length > 0) {
                            left = true;
                        }

                        let added = false;
                        do {
                            if (pieces.length <= j) {
                                pieces.push([piece]);
                                piecePlayers.push(player);
                                added = true;
                            } else {
                                if (piecePlayers[j] == player) {
                                    pieces[j].push(piece);
                                    added = true;
                                }
                            }

                            j++;
                            if (j == maxSize) {
                                j = 0;
                            }
                        } while (!added);
                    }
                }
            } while (left);

            const radius = pieces.length == Constants.pieceCount ? this.smallPieceRadius : this.pieceRadius;
            const point = this.pathPoints.get(pos);
            const x = point.x - (pieces.length - 1) * radius;
            const y = point.y;

            let i = 0;
            pieces.forEach((pieces2) => {
                pieces2.forEach((piece) => {
                    piece.radius = radius;
                    piece.p = new Point(x + i * (radius * 2 + 1), y);
                    piece.p.rotate(point, point.dir);
                });
                i++;
            });
        }
    }

    public validatePiecePositions(): Map<Player, Piece[]> {
        this.log(`validating piece positions...`);
        const invalidPiecePositions = new Map<Player, Piece[]>();
        this.players.forEach(player => {
            player.pieces.forEach(piece => {
                if (piece.p.x < 0 || piece.p.x >= this.width) {
                    this.log(`invalid piece position: player=${player.name} piece=${piece.id} pos=${piece.position} point=(${piece.p.x}, ${piece.p.y})`);
                    if (!invalidPiecePositions.has(player)) {
                        invalidPiecePositions.set(player, []);
                    }

                    invalidPiecePositions.get(player).push(piece);
                } else if (piece.p.y < 0 || piece.p.y >= this.height) {
                    this.log(`invalid piece position: player=${player.name} piece=${piece.id} pos=${piece.position} point=(${piece.p.x}, ${piece.p.y})`);
                    if (!invalidPiecePositions.has(player)) {
                        invalidPiecePositions.set(player, []);
                    }

                    invalidPiecePositions.get(player).push(piece);
                }
            });
        });

        this.log(`validation finished.`);
        return invalidPiecePositions;
    }

    public movePiece(movement: PieceMovement): void {
        movement.piece.position = this.calculateNextPosition(movement.piece, movement.mov);
        this.calculatePiecePositions();
    }
}