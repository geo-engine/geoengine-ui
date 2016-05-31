import moment from 'moment';

import {Projection, Projections} from '../operators/projection.model';

export interface ProjectConfig {
    name: string;
    projection: Projection;
    time: moment.Moment;
}

export class Project {
    name: string;
    projection: Projection;
    time: moment.Moment;

    constructor(config: ProjectConfig) {
        this.name = config.name;
        this.projection = config.projection;
        this.time = config.time;
    }

    static fromJSON(json: string): Project {
        let config = JSON.parse(json);
        // console.log(json, config);
        return new Project({
            name: config.name,
            projection: Projections.fromCode(config.projection),
            time: moment(config.time),
        });
    }

    toJSON(): string {
        return JSON.stringify({
            name: this.name,
            projection: this.projection.getCode(),
            time: this.time.toJSON(),
        });
    }

}
