import {SpatialReference} from '../spatial-references/spatial-reference.model';
import {Time, timeStepDictTotimeStepDuration, TimeStepDuration, timeStepDurationToTimeStepDict} from '../time/time.model';
import {Layer} from '../layers/layer.model';
import {UUID, ToDict, ProjectDict, STRectangleDict, BBoxDict} from '../backend/backend.model';
import {Plot} from '../plots/plot.model';

export class Project implements ToDict<ProjectDict> {
    readonly id: UUID;
    readonly name: string;
    readonly description: string;

    readonly _bbox: BBoxDict;

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
        bbox: BBoxDict;
    }) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this._spatialReference = config.spatialReference;
        this._time = config.time;
        this._plots = config.plots;
        this._layers = config.layers;
        this._timeStepDuration = config.timeStepDuration;
        this._bbox = config.bbox;
    }

    static fromDict(dict: ProjectDict): Project {
        return new Project({
            id: dict.id,
            name: dict.name,
            description: dict.description,
            spatialReference: SpatialReference.fromSrsString(dict.bounds.spatialReference),
            time: Time.fromDict(dict.bounds.timeInterval),
            plots: dict.plots.map(Plot.fromDict),
            layers: dict.layers.map(Layer.fromDict),
            timeStepDuration: timeStepDictTotimeStepDuration(dict.timeStep),
            bbox: dict.bounds.boundingBox,
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
        bbox?: BBoxDict;
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
            bbox: changes.bbox ?? this._bbox,
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
            timeStep: timeStepDurationToTimeStepDict(this.timeStepDuration),
        };
    }

    toBoundsDict(): STRectangleDict {
        return {
            spatialReference: this._spatialReference.srsString,
            timeInterval: this._time.toDict(),
            boundingBox: this._bbox,
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }
}
