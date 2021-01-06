import {SpatialReference, Projections} from '../operators/projection.model';
import {Time, TimeStepDuration} from '../time/time.model';
import {Layer} from '../layers/layer.model';
import {UUID, ToDict, ProjectDict} from '../backend/backend.model';

export class Project implements ToDict<ProjectDict> {
    readonly id: UUID;
    readonly name: string;
    readonly description: string;

    readonly _spatialReference: SpatialReference;

    readonly _plots: Array<any>;
    readonly _layers: Array<Layer>;

    readonly _time: Time;
    readonly _timeStepDuration: TimeStepDuration;

    static fromDict(dict: ProjectDict): Project {
        return new Project({
            id: dict.id,
            name: dict.name,
            projection: Projections.fromCode(dict.bounds.spatial_reference),
            time: Time.fromDict(dict.bounds.time_interval),
            plots: [], // TODO: fill if available
            layers: dict.layers.map(Layer.fromDict),
            timeStepDuration: {durationAmount: 1, durationUnit: 'months'}, // TODO: read from dict
        });
    }

    constructor(config: {
        id: UUID;
        name: string;
        projection: SpatialReference;
        time: Time;
        plots?: Array<any>;
        layers: Array<Layer>;
        timeStepDuration: TimeStepDuration;
    }) {
        this.name = config.name;
        this._spatialReference = config.projection;
        this._time = config.time;
        this._plots = config.plots ? config.plots : [];
        this._layers = config.layers;
        this._timeStepDuration = config.timeStepDuration;
    }

    get time(): Time {
        return this._time;
    }

    get spatialReference(): SpatialReference {
        return this._spatialReference;
    }

    get plots(): Array<any> {
        return this._plots;
    }

    get layers(): Array<Layer> {
        return this._layers;
    }

    get timeStepDuration(): TimeStepDuration {
        return this._timeStepDuration;
    }

    toDict(): ProjectDict {
        const bbox = this._spatialReference.getExtent(); // TODO: allow tighter bbox

        return {
            id: this.id,
            name: this.name,
            description: this.description,
            version: undefined, // TODO: get rid of version?
            bounds: {
                spatial_reference: this._spatialReference.getCode(),
                time_interval: this._time.toDict(),
                bounding_box: {
                    lower_left_coordinate: {
                        x: bbox[0],
                        y: bbox[1],
                    },
                    upper_right_coordinate: {
                        x: bbox[2],
                        y: bbox[3],
                    },
                },
            },
            layers: this._layers.map(layer => layer.toDict()),
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }

}
