
export class Point {

    public x: number;

    public y: number;

    public constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public rotate(c: Point, angle: number): void {
        const dx = this.x - c.x;
        const dy = this.y - c.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);
        this.x = c.x + r * Math.cos(a + angle);
        this.y = c.y + r * Math.sin(a + angle);
    }

    public static copy(another: Point): Point {
        return new Point(another.x, another.y);
    }
}