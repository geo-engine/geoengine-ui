export abstract class Projection {
    toString(): string {
        return this.getEPSGCode();
    }

    abstract getEPSGCode(): string;
}

export class WebMercator extends Projection {
    getEPSGCode(): string {
        return "EPSG:3857";
    }
}

export class WGS84 extends Projection {
    getEPSGCode(): string {
        return "EPSG:4326";
    }
}

class ProjectionCollection {
    WGS_84: Projection =  new WGS84();
    WEB_MERCATOR: Projection = new WebMercator();

    ALL_PROJECTIONS: Array<Projection>;

    constructor() {
        this.ALL_PROJECTIONS = [this.WGS_84, this.WEB_MERCATOR];
    }

    fromEPSGCode(json: string) {
        switch (json) {
            case "EPSG:3857":
                return this.WEB_MERCATOR;
            case "EPSG:4326":
                return this.WGS_84;
            default:
                throw "Invalid Projection String";
        }
    }
}
export const Projections = new ProjectionCollection();

// export namespace Projections {
//     export const WGS_84: WGS84 =  new WGS84();
//     export const WEB_MERCATOR = new WebMercator();
//
//     export const ALL_PROJECTIONS = [WGS_84, WEB_MERCATOR];
// }
