import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {Projections, Projection} from '../operators/projection.model';

import {Project, ProjectConfig} from './project.model';

import moment from 'moment';

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private projection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<moment.Moment>;

    constructor() {
        this.project$ = new BehaviorSubject(
            new Project({
                name: 'Default',
                projection: Projections.WGS_84,
                time: moment('2010-06-06T18:00:00.000Z'),
            })
        );

        this.projection$ = new BehaviorSubject(this.project$.value.projection);
        this.time$ = new BehaviorSubject(this.project$.value.time);

        this.project$.subscribe(project => {
            if (project.projection !== this.projection$.value) {
                this.projection$.next(project.projection);
            }
            if (!project.time.isSame(this.time$.value)) {
                // console.log('time changed', project.time);
                this.time$.next(project.time);
            }
        });

    }

    getProjectStream() {
        return this.project$;
    }

    getProject() {
        return this.project$.getValue();
    }

    setProject(project: Project) {
        this.project$.next(project);
    }

    setTime(time: moment.Moment) {
        const value = this.project$.value;

        this.changeProjectConfig({
            time: time,
            name: value.name,
            projection: value.projection,
        });
    }

    changeProjectConfig(config: ProjectConfig) {
        const project = this.project$.value;

        if (config.name) {
            project.name = config.name;
        }
        if (config.projection) {
            project.projection = config.projection;
        }
        if (config.time) {
            project.time = config.time;
        }

        this.project$.next(project);
    }

    getProjectionStream(): Observable<Projection> {
        return this.projection$;
    }

    getTimeStream(): Observable<moment.Moment> {
        return this.time$;
    }

    getTime(): moment.Moment {
        return this.time$.getValue();
    }

}
