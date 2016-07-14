import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import Config from '../app/config.model';
import {Projections, Projection} from '../operators/projection.model';

import {Project} from './project.model';

import moment from 'moment';

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private projection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<moment.Moment>;

    constructor() {
        this.project$ = new BehaviorSubject(this.createDefaultProject());

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

    createDefaultProject(): Project {
        return new Project({
            name: Config.DEFAULTS.PROJECT.NAME,
            projection: Projections.fromCode(Config.DEFAULTS.PROJECT.PROJECTION),
            time: moment(Config.DEFAULTS.PROJECT.TIME),
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
        if (time.isValid() && !time.isSame(value.time) ) {
            this.changeProjectConfig({
                time: time,
                projection: value.projection,
            });
        }
    }

    changeProjectConfig(config: {projection?: Projection, time?: moment.Moment}) {
        const project = this.project$.value;

        if (config.projection) {
            project.projection = config.projection;
        }
        if (config.time) {
            project.time = config.time;
        }

        this.project$.next(project);
    }

    renameProject(newName: string) {
        const oldProject = this.project$.value;
        const newProject = new Project({
            name: newName,
            projection: oldProject.projection,
            time: oldProject.time,
        });

        this.project$.next(newProject);
    }

    getProjection(): Projection {
        return this.projection$.value;
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
