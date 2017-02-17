import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {BehaviorSubject, Observable, Subscription} from 'rxjs/Rx';
import Config from '../app/config.model';

import {ProjectService} from '../project/project.service';
import {StorageService} from './storage.service';


@Component({
    selector: 'wave-load-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-radio-group
            ngControl="projectName"
            layout="column"
            [style.max-height.px]="(dialog.maxHeight$ | async) / 3"
            *ngIf="!(loading$ | async)"
            [disabled]="loading$ | async"
        >
            <md-radio-button
                *ngFor="let name of projects$ | async"
                [value]="name"
            >{{name}}</md-radio-button>
        </md-radio-group>
        <md-progress-circle
            mode="indeterminate"
            *ngIf="loading$ | async"
        ></md-progress-circle>
    </form>
    `,
    styles: [`
    form {
        margin-top: 8px;
        margin-bottom: 8px;
    }
    md-radio-group {
        overflow-y: auto;
        padding: 0 16px;
    }
    md-radio-button >>> .md-radio-label-content {
        float: none;
    }
    md-progress-circle {
        margin: 0 auto;
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class LoadDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;

    projects$: Promise<Array<string>>;
    loading$ = new BehaviorSubject<boolean>(true);

    private loadButtonSubscription: Subscription;

    constructor(
        private projectService: ProjectService,
        private storageService: StorageService,
        private formBuilder: FormBuilder
    ) {
        super();

        this.form = this.formBuilder.group({
            projectName: [this.projectService.getProject().name, Validators.required],
        });

        this.projects$ = this.storageService.getProjects();

        Observable.merge(
            this.projects$,
            Observable.timer(Config.DELAYS.LOADING.MIN)
        ).last().subscribe(
            _ => this.loading$.next(false)
        );
    }

    ngOnInit() {
        this.dialog.setTitle('Load');
        this.dialog.setSideMargins(false);

        const loadButtonDisabled$ = new BehaviorSubject(true);
        this.loadButtonSubscription = this.form.controls['projectName'].valueChanges.map(
            name => name.length <= 0
        ).subscribe(
            loadButtonDisabled$
        );
        this.dialog.setButtons([
            {
                title: 'Load',
                action: () => this.load(),
                disabled: loadButtonDisabled$,
            },
            {
                title: 'Cancel',
                action: () => this.dialog.close(),
            },
        ]);
    }

    ngOnDestroy() {
        this.loadButtonSubscription.unsubscribe();
    }

    load() {
        this.storageService.loadProjectByName(this.form.controls['projectName'].value);

        this.dialog.close();
    }

}
