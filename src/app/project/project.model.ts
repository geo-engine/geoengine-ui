import {Projection, Projections} from '../operators/projection.model';
import {Time, TimeDict, timeFromDict, TimePoint, TimeInterval} from '../time/time.model';
import {Plot, PlotDict} from '../plots/plot.model';
import {Operator} from '../operators/operator.model';
import {Config} from '../config.service';
import {NotificationService} from '../notification.service';

export interface ProjectConfig {
    name: string;
    projection: Projection;
    time: Time;
    plots?: Array<Plot>;
}

export interface ProjectDict {
    name: string;
    projection: string;
    time: TimeDict;
    plots: Array<PlotDict>;
}

export class Project {
    private _projection: Projection;
    private _time: Time;
    private _name: string;
    private _plots: Array<Plot>;

    static fromJSON(parameters: {
        json: string,
        config: Config,
        notificationService: NotificationService,
        operatorMap?: Map<number, Operator>
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
                time: new TimePoint({ // TODO: insert default time
                    years: 2000,
                    months: 0,
                    date: 1,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    milliseconds: 0,
                }),
                plots: [],
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
            time = new TimePoint({ // TODO: insert default time
                years: 2000,
                months: 0,
                date: 1,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
            });
            parameters.notificationService.error(`Cannot load time because of »${error}«`);
        }

        return new Project({
            name: parameters.dict.name,
            projection: projection,
            time: time,
            plots: plots,
        });
    }

    constructor(config: ProjectConfig) {
        this._name = config.name;
        this._projection = config.projection;
        this._time = config.time;
        this._plots = config.plots ? config.plots : [];
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

    toDict(): ProjectDict {
        return {
            name: this.name,
            projection: this._projection.getCode(),
            time: this._time.asDict(),
            plots: this._plots.map(plot => plot.toDict()),
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }

}
