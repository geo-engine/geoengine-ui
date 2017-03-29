import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {BehaviorSubject} from 'rxjs/Rx';
import {StorageService} from '../../storage/storage.service';
import {ProjectService} from '../project.service';
import {NotificationService} from '../../notification.service';
import {WaveValidators} from '../../util/form.validators';

@Component({
    selector: 'wave-save-project-as',
    templateUrl: './save-project-as.component.html',
    styleUrls: ['./save-project-as.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveProjectAsComponent implements OnInit, AfterViewInit {

    form: FormGroup;

    created$ = new BehaviorSubject(false);

    constructor(private formBuilder: FormBuilder,
                private storageService: StorageService,
                private projectService: ProjectService,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: [
                '',
                Validators.compose([Validators.required, WaveValidators.notOnlyWhitespace]),
                WaveValidators.uniqueProjectName(this.storageService),
            ],
            projection: [this.projectService.getProjection(), Validators.required],
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Save project under new name and switch to it.
     */
    create() {
        const projectName: string = this.form.controls['name'].value;
        this.projectService.setName(projectName);

        this.created$.next(true);
        this.notificationService.info(`Switched to project »${projectName}«`);
    }

}
