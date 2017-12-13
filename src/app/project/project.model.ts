import {Projection, Projections} from '../operators/projection.model';
import {Time, TimeDict, timeFromDict, TimePoint, TimeInterval, TimeStepDuration} from '../time/time.model';
import {Plot, PlotDict} from '../plots/plot.model';
import {Operator} from '../operators/operator.model';
import {Config} from '../config.service';
import {NotificationService} from '../notification.service';
import {Symbology} from '../layers/symbology/symbology.model';
import {Layer, LayerDict} from '../layers/layer.model';

export interface ProjectConfig {
    name: string;
    projection: Projection;
    time: Time;
    plots?: Array<Plot>;
    layers?: Array<Layer<Symbology>>;
    timeStepDuration: TimeStepDuration;
}

export interface ProjectDict {
    name: string;
    projection: string;
    time: TimeDict;
    plots: Array<PlotDict>;
    layers: Array<LayerDict>;
    timeStepDuration: TimeStepDuration;
}

export class Project {
    private _projection: Projection;
    private _time: Time;
    private _name: string;
    private _plots: Array<Plot>;
    private _layers: Array<Layer<Symbology>>;
    private _timeStepDuration: TimeStepDuration;

    static fromJSON(parameters: {
        json: string,
        config: Config,
        notificationService: NotificationService,
        operatorMap?: Map<number, Operator>,
    }): Project {
        if (!parameters.operatorMap) {
            parameters.operatorMap = new Map<number, Operator>();
        }

        try {
            const dict = JSON.parse(parameters.json);
            return Project.fromDict({
                dict: dict,
                config: parameters.config,
                notificationService: parameters.notificationService,
                operatorMap: parameters.operatorMap
            });
        } catch (error) {
            parameters.notificationService.error(`Invalid JSON from project due to »${error}«`);
            // return default project
            return new Project({
                name: parameters.config.DEFAULTS.PROJECT.NAME,
                projection: Projections.fromCode(parameters.config.DEFAULTS.PROJECT.PROJECTION),
                time: new TimePoint(parameters.config.DEFAULTS.PROJECT.TIME),
                plots: [],
                layers: [],
                timeStepDuration: {durationAmount: 1, durationUnit: 'months'}, // TODO: move to DEFAULTS!
            });
        }

    }

    static fromDict(parameters: {
        dict: ProjectDict,
        config: Config,
        notificationService: NotificationService,
        operatorMap?: Map<number, Operator>
    }): Project {
        if (!parameters.operatorMap) {
            parameters.operatorMap = new Map<number, Operator>();
        }

        let plots: Array<Plot>;
        if (parameters.dict.plots) {
            plots = parameters.dict.plots
                .map(plotDict => {
                    try {
                        return Plot.fromDict(plotDict, parameters.operatorMap);
                    } catch (error) {
                        parameters.notificationService.error(`Cannot load plot because of »${error}«`);
                        return undefined;
                    }
                })
                .filter(plot => plot !== undefined);
        } else {
            plots = [];
        }

        let projection: Projection;
        try {
            projection = Projections.fromCode(parameters.dict.projection);
        } catch (error) {
            projection = Projections.fromCode(parameters.config.DEFAULTS.PROJECT.PROJECTION);
            parameters.notificationService.error(`Cannot load projection because of »${error}«`);
        }

        let time: TimePoint | TimeInterval;
        try {
            time = timeFromDict(parameters.dict.time);
        } catch (error) {
            time = new TimePoint(parameters.config.DEFAULTS.PROJECT.TIME);
            parameters.notificationService.error(`Cannot load time because of »${error}«`);
        }

        let layers: Array<Layer<Symbology>>;
        if (parameters.dict.layers) {
            layers = parameters.dict.layers
                .map(layerDict => {
                    try {
                        return Layer.fromDict(layerDict, parameters.operatorMap);
                    } catch (error) {
                        parameters.notificationService.error(`Cannot load layer because of »${error}«`);
                        return undefined;
                    }
                })
                .filter(layer => layer !== undefined);
        } else {
            layers = [];
        }
        let timeStepDuration: TimeStepDuration;
        if (parameters.dict.timeStepDuration) {
            timeStepDuration = parameters.dict.timeStepDuration;
        } else {
            timeStepDuration = {durationAmount: 1, durationUnit: 'months'};
        }

        return new Project({
            name: parameters.dict.name,
            projection: projection,
            time: time,
            plots: plots,
            layers: layers,
            timeStepDuration: timeStepDuration,
        });
    }

    constructor(config: ProjectConfig) {
        this._name = config.name;
        this._projection = config.projection;
        this._time = config.time;
        this._plots = config.plots ? config.plots : [];
        this._layers = config.layers ? config.layers : [];
        this._timeStepDuration = config.timeStepDuration;
    }

    get name(): string {
        return this._name;
    }

    get time(): Time {
        return this._time;
    }

    get projection(): Projection {
        return this._projection;
    }

    get plots(): Array<Plot> {
        return this._plots;
    }

    get layers(): Array<Layer<Symbology>> {
            return this._layers;
    }

    get timeStepDuration(): TimeStepDuration {
        return this._timeStepDuration;
    }

    toDict(): ProjectDict {
        return {
            name: this.name,
            projection: this._projection.getCode(),
            time: this._time.asDict(),
            plots: this._plots.map(plot => plot.toDict()),
            layers: this._layers.map(layer => layer.toDict()),
            timeStepDuration: this._timeStepDuration
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }

}
