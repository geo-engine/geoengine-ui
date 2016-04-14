declare namespace Proj {

    interface Transformer {
        forward: (p: Point) => Point;
        inverse: (p: Point) => Point;
    }

    class Point {
        x: number;
        y: number;
        constructor(x: number, y: number);
    }

    function Proj(a: any, b: any): Transformer;

    export function defs(name: string): any;
    export function defs(name: string, def: string): void;
    export function transform(from: any, to: any, pt: Point): Point;
    export function parse(sr: string): any;

}

declare module "proj4" {
    export = Proj;
}
