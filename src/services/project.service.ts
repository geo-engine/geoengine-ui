import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {Projections, Projection} from "../models/projection.model";

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
            if (project.time !== this.time$.value) {
                console.log("time changed", project.time);
                this.time$.next(project.time);
            }
        });

    }

    getProject() {
        return this.project$;
    }

    getProjectOnce() {
        return this.project$.getValue();
    }

    setProject(project: Project) {
        this.project$.next(project);
    }

    changeProjectConfig(config: ProjectConfig) {
        console.log("config changed:", config);

        let project = this.project$.value;
        project.name = config.name;
        project.workingProjection = config.workingProjection;
        project.mapProjection = config.mapProjection;
        project.time = config.time;

        this.project$.next(project);
    }

    getWorkingProjection(): Observable<Projection> {
        return this.workingProjection$;
    }

    getMapProjection(): Observable<Projection> {
        return this.mapProjection$;
    }

    getTime(): Observable<moment.Moment> {
        return this.time$;
    }

}
