import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {StorageService} from '../../../../storage/storage.service';
import {MatDialogRef} from '@angular/material';
import {RScript} from '../../../../storage/storage-provider.model';
import {NotificationService} from '../../../../notification.service';

export interface RScriptLoadResult {
    script: RScript,
}

@Component({
    selector: 'wave-r-script-load',
    templateUrl: './r-script-load.component.html',
    styleUrls: ['./r-script-load.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RScriptLoadComponent implements OnInit, AfterViewInit {

    form: FormGroup;

    scriptNames$ = new ReplaySubject<Array<string>>(1);
    loading$ = new BehaviorSubject<boolean>(true);

    constructor(private storageService: StorageService,
                private formBuilder: FormBuilder,
                private dialogRef: MatDialogRef<RScriptLoadComponent>,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            scriptName: [undefined, Validators.required],
        });

        this.storageService.getRScripts()
            .subscribe(scripts => {
                this.scriptNames$.next(scripts);
                this.loading$.next(false);
            });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    load() {
        this.loading$.next(true);

        const scriptName: string = this.form.controls['scriptName'].value;
        this.storageService.loadRScriptByName(
            scriptName
        ).subscribe(script => {
            this.loading$.next(false);
            this.notificationService.info(`Loaded R script  »${scriptName}«`);
            this.dialogRef.close({script: script} as RScriptLoadResult);
        });
    }

}
