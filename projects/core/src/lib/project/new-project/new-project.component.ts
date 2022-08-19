import {BehaviorSubject, zip} from 'rxjs';
import {first, mergeMap} from 'rxjs/operators';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import {ProjectService} from '../project.service';
import {NotificationService} from '../../notification.service';
import {NamedSpatialReference, SpatialReferenceSpecification} from '../../spatial-references/spatial-reference.model';
import {SpatialReferenceService, WEB_MERCATOR} from '../../spatial-references/spatial-reference.service';
import {Time} from '../../time/time.model';
import {extentToBboxDict} from '../../util/conversions';

@Component({
    selector: 'ge-new-project',
    templateUrl: './new-project.component.html',
    styleUrls: ['./new-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectComponent implements OnInit, AfterViewInit {
    spatialReferenceOptions: Array<NamedSpatialReference>;

    form: UntypedFormGroup;

    created$ = new BehaviorSubject(false);

    constructor(
        protected formBuilder: UntypedFormBuilder,
        protected projectService: ProjectService,
        protected notificationService: NotificationService,
        protected spatialReferenceService: SpatialReferenceService,
    ) {
        this.spatialReferenceOptions = this.spatialReferenceService.getSpatialReferences();
        this.form = this.formBuilder.group({
            name: [
                '',
                Validators.required,
                // TODO: check for uniqueness
                // WaveValidators.uniqueProjectName(this.storageService),
            ],
            spatialReference: [WEB_MERCATOR, Validators.required],
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
        const spatialReference = this.form.controls['spatialReference'].value;

        zip(this.projectService.getTimeStream(), this.spatialReferenceService.getSpatialReferenceSpecification(spatialReference.srsString))
            .pipe(
                first(),
                mergeMap(([time, spec]: [Time, SpatialReferenceSpecification]) => {
                    const projectName: string = this.form.controls['name'].value;

                    return this.projectService.createProject({
                        name: projectName,
                        description: projectName, // TODO: add description
                        spatialReference: spec.spatialReference,
                        bounds: extentToBboxDict(spec.extent),
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
