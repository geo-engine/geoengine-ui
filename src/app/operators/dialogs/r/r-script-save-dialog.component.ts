import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';

import {BehaviorSubject, Subscription, Observer, Observable} from 'rxjs/Rx';

import {StorageService} from '../../../../storage/storage.service';
import {RScript} from '../../../../storage/storage-provider.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

interface RScriptSaveDialogType {
    initialName: string;
    script: RScript;
    newName$: Observer<string>;
    [index: string]: string | Observer<string> | RScript;
}

@Component({
    selector: 'wave-r-script-save-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-input
            type="text"
            placeholder="Script Name"
            ngControl="name"
        >
            <md-hint align="end" *ngIf="form.controls.name.errors?.required"
            >The name must be non-empty.</md-hint>
        
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
        color: red; // TODO: refactor
    }
    md-progress-circle {
        position: absolute;
        width: 50px;
        height: 50px;
        top: 16px;
        left: calc(50% - 50px/2);
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class RScriptSaveDialogComponent
                                        implements OnInit, OnDestroy {
    form: FormGroup;
    loading$ = new BehaviorSubject(false);

    private subscriptions: Array<Subscription> = [];

    constructor(
        private storageService: StorageService,
        private formBuilder: FormBuilder
    ) {
        // super();
    }

    ngOnInit() {
        // this.dialog.setTitle('Save R Script');

        const nameControl = this.formBuilder.control(
            '',
            Validators.required
        );
        this.form = this.formBuilder.group({
            name: nameControl,
        });

        const saveButtonDisabled$ = new BehaviorSubject(true);
        this.subscriptions.push(
            Observable.combineLatest(
                this.form.statusChanges,
                this.loading$,
                (status, loading) => status === 'INVALID' || loading
            ).subscribe(
                saveButtonDisabled$
            )
        );

        // nameControl.setValue(this.dialogInput.initialName);
        //
        // this.dialog.setButtons([
        //     {
        //         title: 'Save',
        //         action: () => this.save(),
        //         disabled: saveButtonDisabled$,
        //     },
        //     {
        //         title: 'Cancel',
        //         action: () => this.dialog.close(),
        //     },
        // ]);
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    save() {
        this.loading$.next(true);
        const scriptName = this.form.controls['name'].value as string;
        // this.storageService.saveRScript(scriptName, this.dialogInput.script).then(() => {
        //     this.dialogInput.newName$.next(scriptName);
        //     this.loading$.next(false);
        //     this.dialog.close();
        // });
    }

}
