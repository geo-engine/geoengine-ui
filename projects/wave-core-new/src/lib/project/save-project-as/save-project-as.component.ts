import {BehaviorSubject} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {StorageService} from '../../storage/storage.service';
import {ProjectService} from '../project.service';
import {NotificationService} from '../../notification.service';
import {WaveValidators} from '../../util/form.validators';
import {SpatialReferences} from '../../operators/spatial-reference.model';

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
                // WaveValidators.uniqueProjectName(this.storageService), // TODO: check for uniqueness
            ],
            projection: [SpatialReferences.WEB_MERCATOR, Validators.required],
        });
        this.projectService.getProjectOnce().subscribe(project => {
            this.form.controls['name'].setValue(project.name);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Save project under new name.
     *
     * TODO: allow optionally to clone project
     */
    save() {
        const projectName: string = this.form.controls['name'].value;
        this.projectService.setName(projectName).subscribe(() => {
            this.created$.next(true);
            this.notificationService.info(`Renamed project to »${projectName}«`);
        });
    }

}
