import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

import {Layer} from '../layer.model';
import {Symbology} from '../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MdDialogRef} from '@angular/material';
import {ProjectService} from '../../project/project.service';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <wave-dialog-header>Rename the Current Layer</wave-dialog-header>
    <form [formGroup]="form" (ngSubmit)="$event.preventDefault();save($event)">
        <md-dialog-content>
            <md-input-container class="flex-item" fxFlex>
                <input mdInput type="text" placeholder="Name" formControlName="layerName">
            </md-input-container>
        </md-dialog-content>
        <md-dialog-actions align="end">
            <button md-raised-button type="submit" color="primary" [disabled]="form.invalid">Save</button>
        </md-dialog-actions>
    </form>
    `,
    styles: [`
    form {
        padding-top: 16px;
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
        private dialogRef: MdDialogRef<RenameLayerComponent>
    ) {}

    ngOnInit(): void {
        this.layer = (this.dialogRef.config as {layer?: Layer<Symbology>}).layer;
        this.form = this.formBuilder.group({
            layerName: [this.layer.name, Validators.required]
        });
    }

    /**
     * Save the layer name and close the dialog.
     */
    save() {
        const layerName = this.form.controls['layerName'].value;
        if (layerName !== this.layer.name) {
            this.projectService.changeLayerName(this.layer, layerName);
        }
        this.dialogRef.close();
    }

}
