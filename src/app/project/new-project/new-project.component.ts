import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators, AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {Observable, Observer, BehaviorSubject} from 'rxjs/Rx';
import {StorageService} from '../../storage/storage.service';
import {ProjectService} from '../project.service';
import {LayerService} from '../../layers/layer.service';
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
                private layerService: LayerService,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['', Validators.required, WaveValidators.uniqueProjectName(this.storageService)],
            projection: [this.projectService.getProjection(), Validators.required],
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Create a new project and switch to it.
     */
    create() {
        const projectName: string = this.form.controls['name'].value;
        this.projectService.setProject(
            new Project({
                name: projectName,
                projection: this.form.controls['projection'].value,
                time: this.projectService.getTime(),
            })
        );
        this.layerService.setLayers([]);

        this.created$.next(true);
        this.notificationService.info(`Created and switched to new project »${projectName}«`);
    }

}
