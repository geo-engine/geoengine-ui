import {GridBoundingBox2D as GridBoundingBox2DDict} from '@geoengine/openapi-client';
import {ToDict} from '../time/time.model';
import {GridIdx2D} from './grid-idx.model';

export class GridBoundingBox2D implements ToDict<GridBoundingBox2DDict>{
    topLeftIdx: GridIdx2D;
    bottomRightIdx: GridIdx2D;

    constructor(upperLeftIdx: GridIdx2D, lowerRightIdx: GridIdx2D) {
        this.bottomRightIdx =lowerRightIdx; 
        this.topLeftIdx = upperLeftIdx;
    }

    public contains(idx: GridIdx2D): boolean {
        const con_x = this.topLeftIdx.xIdx <= idx.xIdx && idx.xIdx <= this.bottomRightIdx.xIdx;
        const con_y = this.topLeftIdx.yIdx <= idx.yIdx && idx.yIdx <= this.bottomRightIdx.yIdx;
        return con_x && con_y
    }

    public get numberOfPixelsX(): number {
        return this.bottomRightIdx.xIdx - this.topLeftIdx.xIdx + 1;
    }

    public get numberOfPixelsY(): number {
        return this.bottomRightIdx.yIdx - this.topLeftIdx.yIdx + 1;
    }

    toDict(): GridBoundingBox2DDict {
        return {
            bottomRightIdx: this.bottomRightIdx.toDict(),
            topLeftIdx: this.topLeftIdx.toDict(),
        }
    }

    public static fromDict(dict:GridBoundingBox2DDict) {
        return new GridBoundingBox2D(GridIdx2D.fromDict(dict.topLeftIdx), GridIdx2D.fromDict(dict.bottomRightIdx))
    }
}
