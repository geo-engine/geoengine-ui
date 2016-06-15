import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup} from '@angular/common';

import {BehaviorSubject, Observable, Subscription} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import Config from '../app/config.model';

import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';

import {StorageService} from '../storage/storage.service';
import {ProjectService} from '../project/project.service';
import {Project} from '../project/project.model';

@Component({
    selector: 'wave-plot-detail-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-input
            type="text" placeholder="Current Project Name"
            [ngModel]="project.name"
        ></md-input>
        <md-input
            type="text" placeholder="New Project Name"
            ngControl="name"
        >
            <md-hint align="end" *ngIf="invalidNewName$ | async"
            >The new name must be different and non-empty.</md-hint>
            <md-hint align="end" *ngIf="usedName$ | async"
            >The name is already in use.</md-hint>
        </md-input>
        <md-progress-circle
            mode="indeterminate"
            *ngIf="loading$ | async"
        ></md-progress-circle>
        <md-progress-circle style="width: 0; height: 0;"
            mode="indeterminate"
        ></md-progress-circle>
    </form>
    `,
    styles: [`
    form {
        margin-top: 8px;
        margin-bottom: 8px;
    }
    md-hint {
        color: ${Config.COLORS.WARN};
    }
    md-progress-circle {
        position: absolute;
        margin-top: -34px;
        right: 30px;
        width: 19px;
        height: 19px;
    }
    `],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class SaveAsDialogComponent extends DefaultBasicDialog implements OnInit, OnDestroy {
    form: ControlGroup;

    project: Project;
    invalidNewName$: Observable<boolean>;
    usedName$: Observable<boolean>;
    loading$ = new BehaviorSubject<boolean>(false);

    private saveButtonSubscription: Subscription;

    constructor(
        private storageService: StorageService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        super();
        this.project = this.projectService.getProject();

        const nameControl = this.formBuilder.control('', Validators.required);
        this.form = this.formBuilder.group({
            name: nameControl,
        });

        this.invalidNewName$ = nameControl.valueChanges.map((value: string) => {
            return value.length === 0 || this.project.name === value;
        });

        this.usedName$ = Observable.combineLatest(
            nameControl.valueChanges,
            this.invalidNewName$,
            (value, invalid) => invalid ? '' : value as string
        ).debounceTime(
            400
        ).filter(
            value => value.length > 0
        ).switchMap(value => {
            this.loading$.next(true);
            const promise = this.storageService.projectExists(value);
            Observable.merge(
                promise,
                Observable.timer(500)
            ).last().subscribe(
                _ => this.loading$.next(false)
            );
            return promise;
        });
    }

    ngOnInit() {
        this.dialog.setTitle('Save as...');

        const saveButtonDisabled$ = new BehaviorSubject(true);
        this.saveButtonSubscription = Observable.combineLatest(
            this.invalidNewName$,
            this.usedName$,
            this.loading$,
            (invalidNewName, usedName, loading) => invalidNewName || usedName || loading
        ).subscribe(
            saveButtonDisabled$
        );
        this.dialog.setButtons([
            {
                title: 'Save',
                action: () => this.saveAs(),
                disabled: saveButtonDisabled$,
            },
            {
                title: 'Cancel',
                action: () => this.dialog.close(),
            },
        ]);
    }

    ngOnDestroy() {
        this.saveButtonSubscription.unsubscribe();
    }

    saveAs() {
        this.projectService.renameProject(this.form.controls['name'].value);

        this.dialog.close();
    }

}
