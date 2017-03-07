import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {Projections, Projection} from '../app/operators/projection.model';

import {Project} from './project.model';

import {Time, TimePoint} from '../app/time.model';
import * as moment from 'moment';
import {Config} from '../app/config.service';

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private projection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<Time>;

    constructor(private config: Config) {
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
            name: this.config.DEFAULTS.PROJECT.NAME,
            projection: Projections.fromCode(this.config.DEFAULTS.PROJECT.PROJECTION),
            time: new TimePoint(moment(this.config.DEFAULTS.PROJECT.TIME)),
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

    setTime(time: Time) {
        const value = this.project$.value;
        if (time.isValid() && !time.isSame(value.time) ) {
            this.changeProjectConfig({
                time: time,
                projection: value.projection,
            });
        }
    }

    changeProjectConfig(config: {projection?: Projection, time?: Time}) {
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

    getTimeStream(): Observable<Time> {
        return this.time$;
    }

    getTime(): Time {
        return this.time$.getValue();
    }

}
