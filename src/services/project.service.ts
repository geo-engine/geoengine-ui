import {Injectable} from "angular2/core";
import {BehaviorSubject} from "rxjs/Rx";

import {Projections} from "../models/projection.model";

import {Project, ProjectConfig} from "../models/project.model";

@Injectable()
export class ProjectService {
    private project$: BehaviorSubject<Project>;

    constructor() {
        this.project$ = new BehaviorSubject(
            new Project({
                name: "Default",
                workingProjection: Projections.WGS_84,
                mapProjection: Projections.WEB_MERCATOR
            })
        );
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

}
