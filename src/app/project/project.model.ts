import {Projection, Projections} from '../operators/projection.model';
import {Time, TimeDict, timeFromDict, TimePoint, TimeInterval} from '../time/time.model';
import {Plot, PlotDict} from '../plots/plot.model';
import {Operator} from '../operators/operator.model';

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

    static fromJSON(json: string, operatorMap = new Map<number, Operator>()): Project {
        const config = JSON.parse(json);
        return Project.fromDict(config, operatorMap);
    }

    static fromDict(dict: ProjectDict, operatorMap = new Map<number, Operator>()): Project {
        let plots: Array<Plot>;
        if (dict.plots) {
            plots = dict.plots
                .map(plotDict => {
                    try {
                        return Plot.fromDict(plotDict, operatorMap);
                    } catch (error) {
                        // TODO: show reason to user
                        console.error(`Cannot load plot because of ${error}`);
                        return undefined;
                    }
                })
                .filter(plot => plot !== undefined);
        } else {
            plots = [];
        }

        let projection: Projection;
        try {
            projection = Projections.fromCode(dict.projection);
        } catch (error) {
            projection = Projections.WEB_MERCATOR; // TODO: insert default project
            // TODO: show reason to user
            console.error(`Cannot load projection because of ${error}`);
        }

        let time: TimePoint | TimeInterval;
        try {
            time = timeFromDict(dict.time);
        } catch  (error) {
            time = new TimePoint({
                years: 2000,
                months: 0,
                date: 1,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
            }); // TODO: insert default time
            // TODO: show reason to user
            console.error(`Cannot load time because of ${error}`);
        }

        return new Project({
            name: dict.name,
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
