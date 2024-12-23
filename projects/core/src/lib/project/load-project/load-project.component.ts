import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {Component, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {ProjectService} from '../project.service';
import {UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors} from '@angular/forms';
import {BackendService} from '../../backend/backend.service';
import {UUID} from '../../backend/backend.model';
import {NotificationService, UserService} from '@geoengine/common';

const notCurrentProject =
    (currentProjectId: () => string): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const errors: {
            currentProject?: boolean;
        } = {};

        if (currentProjectId() === control.value) {
            errors.currentProject = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };

interface ProjectListing {
    id: UUID;
    name: string;
    description: string;
}

@Component({
    selector: 'geoengine-load-project',
    templateUrl: './load-project.component.html',
    styleUrls: ['./load-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadProjectComponent implements AfterViewInit {
    form: UntypedFormGroup;

    projects$ = new ReplaySubject<Array<ProjectListing>>(1);
    loading$ = new BehaviorSubject<boolean>(true);

    currentProjectId: UUID = '';

    constructor(
        protected projectService: ProjectService,
        protected backend: BackendService,
        protected userService: UserService,
        protected notificationService: NotificationService,
        protected formBuilder: UntypedFormBuilder,
    ) {
        this.projectService.getProjectOnce().subscribe((project) => {
            this.currentProjectId = project.id;
        });

        this.form = this.formBuilder.group({
            projectId: [this.currentProjectId, Validators.compose([Validators.required, notCurrentProject(() => this.currentProjectId)])],
        });

        this.userService
            .getSessionTokenForRequest()
            .pipe(
                mergeMap((sessionToken) =>
                    this.backend.listProjects(
                        {
                            permissions: ['Owner'], // TODO: allow others to be selected
                            filter: 'None', // TODO: add filter search
                            order: 'DateAsc', // TODO: provide options
                            offset: 0,
                            limit: 20, // TODO: paginate
                        },
                        sessionToken,
                    ),
                ),
                map((projectListingDicts) =>
                    projectListingDicts.map((projectListingDict) => ({
                        id: projectListingDict.id,
                        name: projectListingDict.name,
                        description: projectListingDict.description,
                    })),
                ),
            )
            .subscribe((projectListings) => {
                this.projects$.next(projectListings);
                this.loading$.next(false);
            });
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    load(): void {
        const newProjectId: string = this.form.controls['projectId'].value;
        this.projectService.loadAndSetProject(newProjectId).subscribe((project) => {
            this.currentProjectId = newProjectId;
            setTimeout(() => this.form.controls['projectId'].updateValueAndValidity({emitEvent: true}));

            this.notificationService.info(`Switched to project »${project.name}«`);
        });
    }
}
