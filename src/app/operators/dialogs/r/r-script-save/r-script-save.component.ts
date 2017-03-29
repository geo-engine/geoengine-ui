import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {StorageService} from '../../../../storage/storage.service';
import {MdDialogRef, MdDialogConfig} from '@angular/material';
import {RScript} from '../../../../storage/storage-provider.model';
import {BehaviorSubject} from 'rxjs/Rx';
import {NotificationService} from '../../../../notification.service';
import {WaveValidators} from '../../../../util/form.validators';

export interface RScriptSaveComponentConfig extends MdDialogConfig {
    script: RScript;
}


@Component({
    selector: 'wave-r-script-save',
    templateUrl: './r-script-save.component.html',
    styleUrls: ['./r-script-save.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RScriptSaveComponent implements OnInit, AfterViewInit {

    form: FormGroup;

    loading$ = new BehaviorSubject<boolean>(false);

    constructor(private storageService: StorageService,
                private formBuilder: FormBuilder,
                private dialogRef: MdDialogRef<RScriptSaveComponent>,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        const config = this.dialogRef.config as RScriptSaveComponentConfig;

        this.form = this.formBuilder.group({
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            script: [config.script, Validators.required],
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    save() {
        this.loading$.next(true);

        const scriptName: string = this.form.controls['name'].value;
        const script: RScript = this.form.controls['script'].value;

        this.storageService.saveRScript(scriptName, script)
            .subscribe(() => {
                this.loading$.next(false);
                this.notificationService.info(`Stored R script »${scriptName}«`);
                this.dialogRef.close();
            });
    }

}
