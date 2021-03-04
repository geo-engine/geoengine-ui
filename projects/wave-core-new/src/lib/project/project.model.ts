import {SpatialReference, SpatialReferences} from '../operators/spatial-reference.model';
import {Time, timeStepDictTotimeStepDuration, TimeStepDuration, timeStepDurationToTimeStepDict} from '../time/time.model';
import {Layer} from '../layers/layer.model';
import {UUID, ToDict, ProjectDict, STRectangleDict} from '../backend/backend.model';
import {Plot} from '../plots/plot.model';

export class Project implements ToDict<ProjectDict> {
    readonly id: UUID;
    readonly name: string;
    readonly description: string;

    readonly _spatialReference: SpatialReference;

    readonly _plots: Array<any>;
    readonly _layers: Array<Layer>;

    readonly _time: Time;
    readonly _timeStepDuration: TimeStepDuration;

    constructor(config: {
        id: UUID;
        name: string;
        description: string;
        spatialReference: SpatialReference;
        time: Time;
        plots: Array<Plot>;
        layers: Array<Layer>;
        timeStepDuration: TimeStepDuration;
    }) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this._spatialReference = config.spatialReference;
        this._time = config.time;
        this._plots = config.plots;
        this._layers = config.layers;
        this._timeStepDuration = config.timeStepDuration;
    }

    static fromDict(dict: ProjectDict): Project {
        return new Project({
            id: dict.id,
            name: dict.name,
            description: dict.description,
            spatialReference: SpatialReferences.fromCode(dict.bounds.spatial_reference),
            time: Time.fromDict(dict.bounds.time_interval),
            plots: dict.plots.map(Plot.fromDict),
            layers: dict.layers.map(Layer.fromDict),
            timeStepDuration: timeStepDictTotimeStepDuration(dict.time_step),
        });
    }

    updateFields(changes: {
        id?: UUID;
        name?: string;
        description?: string;
        spatialReference?: SpatialReference;
        time?: Time;
        plots?: Array<any>;
        layers?: Array<Layer>;
        timeStepDuration?: TimeStepDuration;
    }): Project {
        return new Project({
            id: changes.id ?? this.id,
            name: changes.name ?? this.name,
            description: changes.description ?? this.description,
            spatialReference: changes.spatialReference ?? this.spatialReference,
            time: changes.time ?? this.time,
            plots: changes.plots ?? this.plots,
            layers: changes.layers ?? this.layers,
            timeStepDuration: changes.timeStepDuration ?? this.timeStepDuration,
        });
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
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            version: undefined, // TODO: get rid of version?
            bounds: this.toBoundsDict(),
            layers: this._layers.map((layer) => layer.toDict()),
            plots: this._plots.map((plot) => plot.toDict()),
            time_step: timeStepDurationToTimeStepDict(this.timeStepDuration),
        };
    }

    toBoundsDict(): STRectangleDict {
        const bbox = this._spatialReference.getExtent(); // TODO: allow tighter bbox

        return {
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
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }
}
