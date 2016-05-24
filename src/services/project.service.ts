import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {Projections, Projection} from '../operators/projection.model';

import {Project, ProjectConfig} from "../models/project.model";

import moment from "moment";

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private mapProjection$: BehaviorSubject<Projection>;
    private workingProjection$: BehaviorSubject<Projection>;

    private time$: BehaviorSubject<moment.Moment>;

    constructor() {
        this.project$ = new BehaviorSubject(
            new Project({
                name: "Default",
                workingProjection: Projections.WGS_84,
                mapProjection: Projections.WEB_MERCATOR,
                time: moment("2010-06-06T18:00:00.000Z")
            })
        );

        this.mapProjection$ = new BehaviorSubject(this.project$.value.mapProjection);
        this.workingProjection$ = new BehaviorSubject(this.project$.value.workingProjection);
        this.time$ = new BehaviorSubject(this.project$.value.time);

        this.project$.subscribe(project => {
            if (project.mapProjection !== this.mapProjection$.value) {
                this.mapProjection$.next(project.mapProjection);
            }
            if (project.workingProjection !== this.workingProjection$.value) {
                this.workingProjection$.next(project.workingProjection);
            }
            if (!project.time.isSame(this.time$.value)) {
                // console.log("time changed", project.time);
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
        let value = this.project$.value;
        this.changeProjectConfig({
            time: time,
            name: value.name,
            workingProjection: value.workingProjection,
            mapProjection: value.mapProjection
        });
    }

    changeProjectConfig(config: ProjectConfig) {
        // console.log("config changed:", config);

        let project = this.project$.value;
        if (config.name) project.name = config.name;
        if (config.workingProjection) project.workingProjection = config.workingProjection;
        if (config.mapProjection) project.mapProjection = config.mapProjection;
        if (config.time) project.time = config.time;

        this.project$.next(project);
    }

    getWorkingProjectionStream(): Observable<Projection> {
        return this.workingProjection$;
    }

    getMapProjectionStream(): Observable<Projection> {
        return this.mapProjection$;
    }

    getTimeStream(): Observable<moment.Moment> {
        return this.time$;
    }

    getTime(): moment.Moment {
        return this.time$.getValue();
    }

}
