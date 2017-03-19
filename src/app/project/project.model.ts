import {Projection, Projections} from '../operators/projection.model';
import {Time, TimeDict, timeFromDict} from '../time/time.model';
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

    static fromDict(dict: ProjectDict, operatorMap = new Map<number, Operator>()): Project {
        return new Project({
            name: dict.name,
            projection: Projections.fromCode(dict.projection),
            time: timeFromDict(dict.time),
            plots: dict.plots.map(plotDict => Plot.fromDict(plotDict, operatorMap)),
        });
    }

    static fromJSON(json: string, operatorMap = new Map<number, Operator>()): Project {
        const config = JSON.parse(json);
        return Project.fromDict(config, operatorMap);
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
