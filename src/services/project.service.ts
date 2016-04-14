import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {Projections, Projection} from "../models/projection.model";

import {Project, ProjectConfig} from "../models/project.model";

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;
    private mapProjection$: BehaviorSubject<Projection>;
    private workingProjection$: BehaviorSubject<Projection>;

    constructor() {
        this.project$ = new BehaviorSubject(
            new Project({
                name: "Default",
                workingProjection: Projections.WGS_84,
                mapProjection: Projections.WEB_MERCATOR
            })
        );

        this.mapProjection$ = new BehaviorSubject(this.project$.value.mapProjection);
        this.workingProjection$ = new BehaviorSubject(this.project$.value.workingProjection);
        this.project$.subscribe(project => {
            if (project.mapProjection !== this.mapProjection$.value) {
                this.mapProjection$.next(project.mapProjection);
            }
            if (project.workingProjection !== this.workingProjection$.value) {
                this.workingProjection$.next(project.workingProjection);
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
        let project = this.project$.value;
        project.name = config.name;
        project.workingProjection = config.workingProjection;
        project.mapProjection = config.mapProjection;

        this.project$.next(project);
    }

    getWorkingProjection(): Observable<Projection> {
        return this.workingProjection$;
    }

    getMapProjection(): Observable<Projection> {
        return this.mapProjection$;
    }

}
