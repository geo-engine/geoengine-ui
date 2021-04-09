import {BehaviorSubject} from 'rxjs';
import {first, mergeMap} from 'rxjs/operators';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ProjectService} from '../project.service';
import {NotificationService} from '../../notification.service';
import {SpatialReferences} from '../../operators/spatial-reference.model';

@Component({
    selector: 'wave-new-project',
    templateUrl: './new-project.component.html',
    styleUrls: ['./new-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectComponent implements OnInit, AfterViewInit {
    spatialReferenceOptions = SpatialReferences.ALL_PROJECTIONS;

    form: FormGroup;

    created$ = new BehaviorSubject(false);

    constructor(
        protected formBuilder: FormBuilder,
        protected projectService: ProjectService,
        protected notificationService: NotificationService,
    ) {
        this.form = this.formBuilder.group({
            name: [
                '',
                Validators.required,
                // TODO: check for uniqueness
                // WaveValidators.uniqueProjectName(this.storageService),
            ],
            spatialReference: [SpatialReferences.WEB_MERCATOR, Validators.required],
        });
        this.projectService
            .getSpatialReferenceStream()
            .pipe(first())
            .subscribe((spatialReference) => {
                this.form.controls['spatialReference'].setValue(spatialReference);
            });
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Create a new project and switch to it.
     */
    create(): void {
        this.projectService
            .getTimeStream()
            .pipe(
                first(),
                mergeMap((time) => {
                    const projectName: string = this.form.controls['name'].value;

                    return this.projectService.createProject({
                        name: projectName,
                        description: projectName, // TODO: add description
                        spatialReference: this.form.controls['spatialReference'].value,
                        time,
                        timeStepDuration: {durationAmount: 1, durationUnit: 'months'},
                    });
                }),
            )
            .subscribe((project) => {
                this.projectService.setProject(project);
                this.created$.next(true);
                this.notificationService.info(`Created and switched to new project »${project.name}«`);
            });
    }
}
