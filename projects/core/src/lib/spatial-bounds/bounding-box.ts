import {Extent} from 'ol/extent';
import {BBoxDict} from '../backend/backend.model';

export class BoundingBox2D {
    private readonly inner: [number, number, number, number];

    public get xmin(): number {
        return this.inner[0];
    }

    public get ymin(): number {
        return this.inner[1];
    }

    public get xmax(): number {
        return this.inner[2];
    }

    public get ymax(): number {
        return this.inner[3];
    }

    public get upperLeftCoordinate(): {x: number; y: number} {
        return {
            x: this.xmin,
            y: this.ymax,
        };
    }

    public get lowerRightCoordinate(): {x: number; y: number} {
        return {
            x: this.xmax,
            y: this.ymin,
        };
    }

    public get upperRightCoordinate(): {x: number; y: number} {
        return {
            x: this.xmax,
            y: this.ymax,
        };
    }

    public get lowerLeftCoordinate(): {x: number; y: number} {
        return {
            x: this.xmin,
            y: this.ymin,
        };
    }

    /**
     * Returns an new boundingbox.
     *
     * @param param0 The bounds of the new BoundingBox as `[xmin, ymin, xmax, ymax]`.
     */
    constructor([xmin, ymin, xmax, ymax]: [number, number, number, number]) {
        if (xmin > xmax || ymin > ymax) {
            throw new Error('Invalid bounding box');
        }
        this.inner = [xmin, ymin, xmax, ymax];
    }

    /**
     * Creates a new BoundingBox from the given numbers.
     *
     * @param xmin - The minimum x value.
     * @param ymin - The minimum y value.
     * @param xmax - The maximum x value.
     * @param ymax - The maximum y value.
     * @returns - A new BoundingBox.
     */
    public static fromNumbers(xmin: number, ymin: number, xmax: number, ymax: number): BoundingBox2D {
        return new BoundingBox2D([xmin, ymin, xmax, ymax]);
    }

    /**
     * Creates a new BoundingBox from a `BBoxDict`.
     *
     * @param dict - The input dict.
     * @returns - A new BoundingBox.
     */
    public static fromDict(dict: BBoxDict): BoundingBox2D {
        return BoundingBox2D.fromNumbers(
            dict.lowerLeftCoordinate.x,
            dict.lowerLeftCoordinate.y,
            dict.upperRightCoordinate.x,
            dict.upperRightCoordinate.y,
        );
    }

    /**
     * Creates a new BoundingBox from an OpenLayers extent.
     *
     * @param extent - The input extent.
     * @returns - A new BoundingBox.
     */
    public static fromOlExtent(extent: Extent): BoundingBox2D {
        if (extent.length !== 4) {
            throw new Error('Invalid extent');
        }
        return new BoundingBox2D(extent as [number, number, number, number]);
    }

    /**
     * Transforms a bounding box to a OpenLayers extent.
     *
     * @returns - The OpenLayers extent.
     */
    public toOlExtent(): Extent {
        return this.inner as Extent;
    }

    /**
     * Transforms a bounding box to a `BBoxDict`.
     *
     * @returns - The `BBoxDict`.
     */
    public toDict(): BBoxDict {
        return {
            lowerLeftCoordinate: {
                x: this.xmin,
                y: this.ymin,
            },
            upperRightCoordinate: {
                x: this.xmax,
                y: this.ymax,
            },
        };
    }
}
