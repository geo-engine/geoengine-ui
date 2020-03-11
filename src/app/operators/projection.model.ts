import {get as olGetProjection, addProjection as olAddProjection, Projection as OlProjection} from 'ol/proj';

/**
 * A wrapper class around a projection string.
 */
export abstract class Projection {
    /**
     * @returns {string} x coordinate name
     */
    get xCoordinateName(): string {
        return 'x';
    }

    /**
     * @returns {string} y coordinate name
     */
    get yCoordinateName(): string {
        return 'y';
    }

    /**
     * Create a human readable output of the projection.
     * @returns The name and the code.
     */
    toString(): string {
        return `[${this.getCode()}] ${this.getName()}`;
    }

    /**
     * @return The code of the projection.
     */
    abstract getCode(): string;

    /**
     * @return The name of the projection.
     */
    abstract getName(): string;

    /**
     * @return The `ol.proj.Projection` for openlayers.
     */
    getOpenlayersProjection(): OlProjection {
        return olGetProjection(this.getCode());
    }

    /**
     * @return The maximal extent of the projection.
     */
    abstract getExtent(): [number, number, number, number];

    /**
     * @return the crs uri.
     */
    abstract getCrsURI(): string;
}

export class WebMercator extends Projection {
    getCode(): string {
        return 'EPSG:3857';
    }

    getName(): string {
        return 'WGS84 Web Mercator';
    }

    getExtent(): [number, number, number, number] {
        return [-20037508.34, -20037508.34, 20037508.34, 20037508.34];
    }

    getCrsURI(): string {
        return 'http://www.opengis.net/def/crs/EPSG/0/3857';
    }
}

export class WGS84 extends Projection {
    get xCoordinateName(): string {
        return 'longitude';
    }

    get yCoordinateName(): string {
        return 'latitude';
    }

    getCode(): string {
        return 'EPSG:4326';
    }

    getName(): string {
        return 'WGS 84';
    }

    getExtent(): [number, number, number, number] {
        return [-180, -90, 180, 90];
    }

    getCrsURI(): string {
        return 'http://www.opengis.net/def/crs/EPSG/0/4326';
    }
}

export class UTM32N extends Projection {
    private static isProjectionRegistered = false;

    getCode(): string {
        return 'EPSG:32632';
    }

    getName(): string {
        return 'WGS 84 / UTM 32 N';
    }

    getExtent(): [number, number, number, number] {
        return [166021.4431, 0.0000, 833978.5569, 9329005.1825];
    }

    getCrsURI(): string {
        return 'http://www.opengis.net/def/crs/EPSG/0/32632';
    }

    private registerProjection() {

        if (!UTM32N.isProjectionRegistered) {
            olAddProjection(new OlProjection({
                code: this.getCode(),
                extent: this.getExtent(),
                units: 'm'
            }));

            UTM32N.isProjectionRegistered = true;
        }

    }
}

export class ETRS89UTM32N extends Projection {
    private static isProjectionRegistered = false;

    getCode(): string {
        return 'EPSG:25832';
    }

    getName(): string {
        return 'ETRS89 / UTM 32 N';
    }

    getExtent(): [number, number, number, number] {
        return [265948.8191, 6421521.2254, 677786.3629, 7288831.7014];
    }

    getCrsURI(): string {
        return 'http://www.opengis.net/def/crs/EPSG/0/25832';
    }

    private registerProjection() {

        if (!ETRS89UTM32N.isProjectionRegistered) {
            olAddProjection(new OlProjection({
                code: this.getCode(),
                extent: this.getExtent(),
                units: 'm'
            }));

            ETRS89UTM32N.isProjectionRegistered = true;
        }

    }
}

export class GEOS extends Projection {
    private static isProjectionRegistered = false;

    constructor() {
        super();
        this.registerProjection();
    }

    // TODO: remove when code is correct
    toString(): string {
        return `[SR-ORG:81] ${this.getName()}`;
    }

    getCode(): string {
        // TODO: rename?
        return 'SR-ORG:81'; // return 'EPSG:40453';
    }

    getName(): string {
        return 'GEOS - GEOstationary Satellite';
    }

    getOpenlayersProjection() {
        let projection = olGetProjection(this.getCode());
        projection.setExtent(this.getExtent()); // TODO: DT ol.proj.Projection => setExtent
        return projection;
    }

    getExtent(): [number, number, number, number] {
        return [-5568748.276, -5568748.276, 5568748.276, 5568748.276];
    }

    getCrsURI(): string {
        return 'http://spatialreference.org/ref/sr-org/81/gml/';
    }

    private registerProjection() {

        if (!GEOS.isProjectionRegistered) {
            olAddProjection(new OlProjection({
                code: this.getCode(),
                extent: this.getExtent(),
                units: 'm'
            }));

            GEOS.isProjectionRegistered = true;
        }

    }
}

class ProjectionCollection {
    WGS_84: Projection = new WGS84();
    WEB_MERCATOR: Projection = new WebMercator();
    GEOS: Projection = new GEOS();
    UTM32N: Projection = new UTM32N();
    ETRS89UTM32N: Projection = new ETRS89UTM32N();

    // required to support already stored layers
    OLD_GEOS_CODE = 'EPSG:40453';

    ALL_PROJECTIONS: Array<Projection>;

    constructor() {
        this.ALL_PROJECTIONS = [this.WGS_84, this.WEB_MERCATOR, this.GEOS, this.UTM32N, this.ETRS89UTM32N];
    }

    fromCode(json: string) {
        switch (json) {
            case this.WEB_MERCATOR.getCode():
                return this.WEB_MERCATOR;
            case this.WGS_84.getCode():
                return this.WGS_84;
            case this.GEOS.getCode():
                return this.GEOS;
            case this.OLD_GEOS_CODE:
                return this.GEOS;
            case this.UTM32N.getCode():
                return this.UTM32N;
            case this.ETRS89UTM32N.getCode():
                return this.ETRS89UTM32N;
            default:
                throw new Error('Invalid Projection String');
        }
    }
}

export const Projections = new ProjectionCollection(); // tslint:disable-line:variable-name
