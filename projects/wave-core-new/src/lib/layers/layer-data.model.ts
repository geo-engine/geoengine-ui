import {Time} from '../time/time.model';
import {LayerType} from './layer.model';
import {SpatialReference} from '../operators/spatial-reference.model';

export abstract class LayerData<D> {
    readonly type: LayerType;
    readonly time: Time;
    readonly spatialReference: SpatialReference;

    protected constructor(type: LayerType, time: Time, spatialReference: SpatialReference) {
        this.type = type;
        this.spatialReference = spatialReference;
        this.time = time;
    }

    abstract get data(): D;
}

export class RasterData extends LayerData<string> {
    _data: string;

    constructor(time: Time,
                spatialReference: SpatialReference,
                data: string) {
        if (time.end.isAfter(time.start)) {
            time = new Time(time.start);
        }
        super('raster', time, spatialReference);
        this._data = data;
    }


    get data(): string {
        return this._data;
    }

}
