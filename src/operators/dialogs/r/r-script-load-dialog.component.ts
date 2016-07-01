import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup} from '@angular/common';

import {BehaviorSubject, Observable, Subscription, Observer} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_RADIO_DIRECTIVES, MdRadioDispatcher} from '@angular2-material/radio';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import Config from '../../../app/config.model';

import {BasicDialog} from '../../../dialogs/basic-dialog.component';

import {StorageService} from '../../../storage/storage.service';
import {RScript} from '../../../storage/storage-provider.model';

type RScriptLoadDialogType = {
    currentName: string,
    newCurrentName$: Observer<string>,
    script$: Observer<RScript>,
    [index: string]: string | Observer<RScript> | Observer<string>,
};

@Component({
    selector: 'wave-r-script-load-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-radio-group
            ngControl="scriptName"
            layout="column"
            [style.max-height.px]="(dialog.maxHeight$ | async) / 3"
            *ngIf="!(loading$ | async)"
            [disabled]="loading$ | async"
        >
            <md-radio-button
                *ngFor="let name of scriptNames$ | async"
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
        padding: 0px 16px;
    }
    md-radio-button >>> .md-radio-label-content {
        float: none;
    }
    md-progress-circle {
        margin: 0 auto;
    }
    `],
    providers: [MdRadioDispatcher],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_RADIO_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class RScriptLoadDialogComponent extends BasicDialog<RScriptLoadDialogType>
                                        implements OnInit, OnDestroy {
    form: ControlGroup;

    scriptNames$: Promise<Array<string>>;
    loading$ = new BehaviorSubject<boolean>(true);

    private subscriptions: Array<Subscription> = [];

    constructor(
        private storageService: StorageService,
        private formBuilder: FormBuilder
    ) {
        super();

        this.scriptNames$ = this.storageService.getRScripts();
    }

    ngOnInit() {
        this.dialog.setTitle('Load R Script');
        this.dialog.setSideMargins(false);

        this.form = this.formBuilder.group({
            scriptName: [this.dialogInput.currentName, Validators.required],
        });

        Observable.merge(
            this.scriptNames$,
            Observable.timer(Config.DELAYS.LOADING.MIN)
        ).last().subscribe(
            _ => this.loading$.next(false)
        );

        const loadButtonDisabled$ = new BehaviorSubject(true);
        this.subscriptions.push(
            Observable.combineLatest(
                this.form.statusChanges,
                this.loading$,
                (status, loading) => status === 'INVALID' || loading
            ).subscribe(
                loadButtonDisabled$
            )
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
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    load() {
        const scriptName = this.form.controls['scriptName'].value;
        this.loading$.next(true);
        this.storageService.loadRScriptByName(
            scriptName
        ).then(script => {
            this.loading$.next(false);
            this.dialogInput.newCurrentName$.next(scriptName);
            this.dialogInput.script$.next(script);
            this.dialog.close();
        });
    }

}
