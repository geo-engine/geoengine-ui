import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {first} from 'rxjs/operators';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {ProjectService} from '../project.service';
import {StorageService} from '../../storage/storage.service';
import {FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn} from '@angular/forms';
import {NotificationService} from '../../notification.service';

function notCurrentProject(currentProjectName: () => string): ValidatorFn {
    return (control: AbstractControl): {[key: string]: boolean} => {
        const errors: {
            currentProject?: boolean;
        } = {};

        if (currentProjectName() === control.value) {
            errors.currentProject = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

@Component({
    selector: 'wave-load-project',
    templateUrl: './load-project.component.html',
    styleUrls: ['./load-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadProjectComponent implements OnInit, AfterViewInit {
    form: FormGroup;

    projects$ = new ReplaySubject<Array<string>>(1);
    loading$ = new BehaviorSubject<boolean>(true);

    currentProjectName: string;

    constructor(
        private projectService: ProjectService,
        private storageService: StorageService,
        private notificationService: NotificationService,
        private formBuilder: FormBuilder,
    ) {}

    ngOnInit() {
        this.currentProjectName = '';
        this.projectService
            .getProjectStream()
            .pipe(first())
            .subscribe((project) => {
                this.currentProjectName = project.name;
            });

        this.form = this.formBuilder.group({
            projectName: [
                this.currentProjectName,
                Validators.compose([Validators.required, notCurrentProject(() => this.currentProjectName)]),
            ],
        });

        this.storageService.getProjects().subscribe((projects) => {
            this.projects$.next(projects);
            this.loading$.next(false);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    load() {
        const newProject: string = this.form.controls['projectName'].value;
        this.storageService.loadProjectByName(newProject);
        this.currentProjectName = newProject;
        setTimeout(() => this.form.controls['projectName'].updateValueAndValidity({emitEvent: true}));

        this.notificationService.info(`Switched to project »${newProject}«`);
    }
}
