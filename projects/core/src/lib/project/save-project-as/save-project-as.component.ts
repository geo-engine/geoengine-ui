import {BehaviorSubject} from 'rxjs';
import {Component, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import {ProjectService} from '../project.service';
import {geoengineValidators, NotificationService} from '@geoengine/common';

@Component({
    selector: 'geoengine-save-project-as',
    templateUrl: './save-project-as.component.html',
    styleUrls: ['./save-project-as.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveProjectAsComponent implements AfterViewInit {
    form: UntypedFormGroup;

    created$ = new BehaviorSubject(false);

    constructor(
        private formBuilder: UntypedFormBuilder,
        private projectService: ProjectService,
        private notificationService: NotificationService,
    ) {
        this.form = this.formBuilder.group({
            name: [
                '',
                Validators.compose([Validators.required, geoengineValidators.notOnlyWhitespace]),
                // geoengineValidators.uniqueProjectName(this.storageService), // TODO: check for uniqueness
            ],
        });
        this.projectService.getProjectOnce().subscribe((project) => {
            this.form.controls['name'].setValue(project.name);
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    /**
     * Save project under new name.
     *
     */
    save(): void {
        const projectName: string = this.form.controls['name'].value;

        this.projectService.cloneProject(projectName).subscribe((project) => {
            this.projectService.setProject(project);
            this.created$.next(true);
            this.notificationService.info(`Saved project to »${project.name}« and switched to it`);
        });
    }
}
