import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {BehaviorSubject} from 'rxjs/Rx';
import {StorageService} from '../../storage/storage.service';
import {ProjectService} from '../project.service';
import {Project} from '../project.model';
import {Projections} from '../../operators/projection.model';
import {NotificationService} from '../../notification.service';
import {WaveValidators} from '../../util/form.validators';

@Component({
    selector: 'wave-new-project',
    templateUrl: './new-project.component.html',
    styleUrls: ['./new-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewProjectComponent implements OnInit, AfterViewInit {

    // make available
    Projections = Projections;
    //

    form: FormGroup;

    created$ = new BehaviorSubject(false);

    constructor(private formBuilder: FormBuilder,
                private storageService: StorageService,
                private projectService: ProjectService,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['', Validators.required, WaveValidators.uniqueProjectName(this.storageService)],
            projection: [Projections.WEB_MERCATOR, Validators.required],
        });
        this.projectService.getProjectionStream().first().subscribe(projection => {
            this.form.controls['projection'].setValue(projection);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Create a new project and switch to it.
     */
    create() {
        this.projectService.getTimeStream().first().subscribe(time => {
            const projectName: string = this.form.controls['name'].value;
            this.projectService.setProject(
                new Project({
                    name: projectName,
                    projection: this.form.controls['projection'].value,
                    time: time,
                    layers: [],
                    timeStepDuration: {durationAmount: 1, durationUnit: 'months'}
                })
            );

            this.created$.next(true);
            this.notificationService.info(`Created and switched to new project »${projectName}«`);
        });
    }

}
