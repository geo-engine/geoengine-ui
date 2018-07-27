import {Component, ChangeDetectionStrategy, OnInit, Inject} from '@angular/core';

import {Layer} from '../layer.model';
import {Symbology} from '../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ProjectService} from '../../project/project.service';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <wave-dialog-header>Rename the Current Layer</wave-dialog-header>
    <form [formGroup]="form" (ngSubmit)="$event.preventDefault();save($event)">
        <mat-dialog-content>
            <mat-form-field>
                <input matInput type="text" placeholder="Name" formControlName="layerName">
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-raised-button type="submit" color="primary" [disabled]="form.invalid">Save</button>
        </mat-dialog-actions>
    </form>
    `,
    styles: [`
    form {
        padding-top: 16px;
    }
    mat-form-field {
        width: 100%;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameLayerComponent implements OnInit {

    form: FormGroup;

    private layer: Layer<Symbology>;

    constructor(
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<RenameLayerComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {layer?: Layer<Symbology>}
    ) {}

    ngOnInit(): void {
        // this.layer = (this.dialogRef.config as {layer?: Layer<Symbology>}).layer;
        this.layer = this.config.layer;
        this.form = this.formBuilder.group({
            layerName: [this.layer.name, Validators.required]
        });
    }

    /**
     * Save the layer name and close the dialog.
     */
    save(event: any) {
        const layerName = this.form.controls['layerName'].value;
        if (layerName !== this.layer.name) {
            this.projectService.changeLayer(this.layer, {name: layerName});
        }
        this.dialogRef.close();
    }

}
