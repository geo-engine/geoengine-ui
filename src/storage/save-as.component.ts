import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {BehaviorSubject, Observable, Subscription} from 'rxjs/Rx';

import {StorageService} from '../app/storage/storage.service';
import {ProjectService} from '../app/project/project.service';
import {Project} from '../app/project/project.model';
import {Config} from '../app/config.service';

@Component({
    selector: 'wave-save-as-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-input
            type="text"
            placeholder="Current Project Name"
            [ngModel]="project.name"
            [disabled]="true"
        >
        <md-input
            type="text"
            placeholder="New Project Name"
            ngControl="name"
        >
            <md-hint align="end" *ngIf="invalidNewName$ | async"
            >The new name must be different and non-empty.</md-hint>
            <md-hint align="end" *ngIf="usedName$ | async"
            >The name is already in use.</md-hint>
        
        <md-progress-circle
            mode="indeterminate"
            *ngIf="loading$ | async"
        ></md-progress-circle>
    </form>
    `,
    styles: [`
    form {
        margin-top: 16px;
        margin-bottom: 16px;
    }
    md-hint {
        color: red;
    }
    md-progress-circle {
        position: absolute;
        margin-top: -34px;
        right: 30px;
        width: 19px;
        height: 19px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class SaveAsDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;

    project: Project;
    invalidNewName$: Observable<boolean>;
    usedName$: Observable<boolean>;
    loading$ = new BehaviorSubject<boolean>(false);

    private saveButtonSubscription: Subscription;

    constructor(
        private config: Config,
        private storageService: StorageService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        // super();
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
            this.config.DELAYS.DEBOUNCE
        ).filter(
            value => value.length > 0
        ).switchMap(value => {
            this.loading$.next(true);
            const promise = this.storageService.projectExists(value);
            Observable.merge(
                promise,
                Observable.timer(this.config.DELAYS.LOADING.MIN)
            ).last().subscribe(
                _ => this.loading$.next(false)
            );
            return promise;
        });
    }

    ngOnInit() {
        // this.dialog.setTitle('Save as...');

        const saveButtonDisabled$ = new BehaviorSubject(true);
        this.saveButtonSubscription = Observable.combineLatest(
            this.invalidNewName$,
            this.usedName$,
            this.loading$,
            (invalidNewName, usedName, loading) => invalidNewName || usedName || loading
        ).subscribe(
            saveButtonDisabled$
        );
        // this.dialog.setButtons([
        //     {
        //         title: 'Save',
        //         action: () => this.saveAs(),
        //         disabled: saveButtonDisabled$,
        //     },
        //     {
        //         title: 'Cancel',
        //         action: () => this.dialog.close(),
        //     },
        // ]);
    }

    ngOnDestroy() {
        this.saveButtonSubscription.unsubscribe();
    }

    saveAs() {
        this.projectService.setName(this.form.controls['name'].value);

        // this.dialog.close();
    }

}
