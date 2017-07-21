import {Component, ChangeDetectionStrategy, OnInit, Inject} from '@angular/core';

import {Layer} from '../layer.model';
import {Symbology} from '../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {ProjectService} from '../../project/project.service';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <wave-dialog-header>Rename the Current Layer</wave-dialog-header>
    <form [formGroup]="form" (ngSubmit)="$event.preventDefault();save($event)">
        <md-dialog-content>
            <md-input-container>
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
    md-input-container {
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
        private dialogRef: MdDialogRef<RenameLayerComponent>,
        @Inject(MD_DIALOG_DATA) private config: {layer?: Layer<Symbology>}
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
    save() {
        const layerName = this.form.controls['layerName'].value;
        if (layerName !== this.layer.name) {
            this.projectService.changeLayer(this.layer, {name: layerName});
        }
        this.dialogRef.close();
    }

}
