
export class Point {

    public x: number;

    public y: number;

    public dir: number;

    public constructor(x: number = 0, y: number = 0, dir: number = 0) {
        this.x = x;
        this.y = y;
        this.dir = dir;
    }

    public rotate(c: Point, angle: number): void {

        const r = 4;
        const rotated = Point.rotatePoint(this, c, angle);
        const rotatedDir = Point.rotatePoint(Point.rotatePoint(new Point(this.x, this.y - r), this, this.dir), c, angle);

        this.x = rotated.x;
        this.y = rotated.y;

        const dx = rotatedDir.x - this.x;
        const dy = this.y - rotatedDir.y;
        this.dir = Math.atan2(dx, dy);
    }

    public static copy(another: Point): Point {
        return new Point(another.x, another.y, another.dir);
    }

    private static rotatePoint(p: Point, c: Point, angle: number): Point {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);

        return new Point(c.x + r * Math.cos(a + angle), c.y + r * Math.sin(a + angle));
    }
}