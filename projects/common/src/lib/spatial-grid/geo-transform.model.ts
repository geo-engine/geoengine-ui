import {GeoTransform as GeoTransformDict} from '@geoengine/openapi-client';
import {ToDict} from '../time/time.model';
import {Coordinate2D} from '../spatial-features/coordinate.model';
import { GridIdx2D } from './grid-idx.model';
import { GridBoundingBox2D } from './grid-bounding-box.model';
import { BoundingBox2D } from '../spatial-bounds/bounding-box';


export class GeoTransform implements ToDict<GeoTransformDict>{
    readonly originCoordinate: Coordinate2D;
    readonly pixelSizeX: number;
    readonly pixelSizeY: number;

    constructor(
        originCoordinate: Coordinate2D,
        pixelSizeX: number,
        pixelSizeY: number,
    ) {
        this.originCoordinate = originCoordinate;
        this.pixelSizeX = pixelSizeX;
        this.pixelSizeY = pixelSizeY;
    }

    public pixel_to_coordinate_ul_edge(gridIdx: GridIdx2D) : Coordinate2D {
        
        let ulx = this.originCoordinate.x + this.pixelSizeX * gridIdx.xIdx;
        let uly = this.originCoordinate.y + this.pixelSizeY * gridIdx.yIdx;

        return new Coordinate2D([ulx, uly])
    }

    public pixel_to_coordinate_center(gridIdx: GridIdx2D): Coordinate2D {
        const ul = this.pixel_to_coordinate_ul_edge(gridIdx)
        return new Coordinate2D([ul.x + 0.5* this.pixelSizeX, ul.y + 0.5 * this.pixelSizeY]) 
    }

    public gridBoundsToSpatialBounds(gridBounds: GridBoundingBox2D): BoundingBox2D {
        const ul = this.pixel_to_coordinate_ul_edge(gridBounds.topLeftIdx);
        const lrIdxPlusOne = new GridIdx2D(gridBounds.bottomRightIdx.xIdx + 1, gridBounds.bottomRightIdx.yIdx + 1);
        const lr = this.pixel_to_coordinate_ul_edge(lrIdxPlusOne);
        return new BoundingBox2D([ul.x, lr.y, lr.x, ul.y])
    }

    toDict(): GeoTransformDict {
        return {
            originCoordinate: this.originCoordinate.toDict(),
            xPixelSize: this.pixelSizeX,
            yPixelSize: this.pixelSizeY
        }
    }


    public static fromDict(dict: GeoTransformDict): GeoTransform {
        return new GeoTransform(Coordinate2D.fromDict(dict.originCoordinate), dict.xPixelSize, dict.yPixelSize)
    }
}