import {Time} from '../time/time.model';
import {LayerType} from './layer.model';
import {SpatialReference} from '../operators/spatial-reference.model';
import {GeoJSON as OlFormatGeoJSON} from 'ol/format';
import {Feature as OlFeature} from 'ol/Feature';
import {ProjectionLike as OlProjectionLike} from 'ol/proj';
import {UUID} from '../backend/backend.model';

export abstract class LayerData {
    readonly type: LayerType;
    readonly time: Time;
    readonly spatialReference: SpatialReference;

    protected constructor(type: LayerType, time: Time, spatialReference: SpatialReference) {
        this.type = type;
        this.spatialReference = spatialReference;
        this.time = time;
    }
}

export class RasterData extends LayerData {
    readonly workflowId: UUID;

    constructor(time: Time, spatialReference: SpatialReference, workflowId: UUID) {
        if (time.end.isAfter(time.start)) {
            time = new Time(time.start);
        }
        super('raster', time, spatialReference);
        this.workflowId = workflowId;
    }
}

export class VectorData extends LayerData {
    readonly data: Array<OlFeature>;
    readonly extent: [number, number, number, number];

    static olParse(
        time: Time,
        projection: SpatialReference,
        extent: [number, number, number, number],
        source: Document | Node | any | string,
        opt_options?: {dataProjection: OlProjectionLike; featureProjection: OlProjectionLike},
    ): VectorData {
        return new VectorData(time, projection, new OlFormatGeoJSON().readFeatures(source, opt_options), extent);
    }

    constructor(time: Time, projection: SpatialReference, data: Array<OlFeature>, extent: [number, number, number, number]) {
        super('vector', time, projection);
        this.data = data;
        this.extent = extent;
        this.fakeIds(); // FIXME: use real IDs ...
    }

    fakeIds() {
        for (let localRowId = 0; localRowId < this.data.length; localRowId++) {
            const feature = this.data[localRowId];
            if (feature.getId() === undefined) {
                feature.setId(localRowId);
            }
        }
    }
}
