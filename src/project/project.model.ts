import moment from 'moment';

import {Projection, Projections} from '../operators/projection.model';

export interface ProjectConfig {
    name: string;
    projection: Projection;
    time: moment.Moment;
}

export interface ProjectDict {
    name: string;
    projection: string;
    time: string;
}

export class Project {
    projection: Projection;
    time: moment.Moment;
    private _name: string;

    constructor(config: ProjectConfig) {
        this._name = config.name;
        this.projection = config.projection;
        this.time = config.time;
    }

    static fromDict(dict: ProjectDict): Project {
        return new Project({
            name: dict.name,
            projection: Projections.fromCode(dict.projection),
            time: moment(dict.time),
        });
    }

    static fromJSON(json: string): Project {
        const config = JSON.parse(json);
        return Project.fromDict(config);
    }

    get name(): string {
        return this._name;
    }

    toDict(): ProjectDict {
        return {
            name: this.name,
            projection: this.projection.getCode(),
            time: this.time.toJSON(),
        };
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }

}
