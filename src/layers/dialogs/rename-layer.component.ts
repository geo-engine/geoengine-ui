import {Component, ChangeDetectionStrategy} from '@angular/core';

import {LayerService} from '../../layers/layer.service';

import {Layer} from '../../layers/layer.model';
import {Symbology} from '../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <wave-dialog-header>Rename the Current Layer</wave-dialog-header>
    <form [formGroup]="form" (ngSubmit)="$event.preventDefault();save($event)">
        <md-dialog-content>
            <md-input-container class="flex-item" fxFlex>
                <input md-input type="text" placeholder="Name" formControlName="layerName">
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
export class RenameLayerComponent {
    form: FormGroup;

    private layer: Layer<Symbology>;

    constructor(
        private layerService: LayerService,
        private formBuilder: FormBuilder,
        private dialogRef: MdDialogRef<RenameLayerComponent>
    ) {
        this.layer = this.layerService.getSelectedLayer();

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
            this.layerService.changeLayerName(this.layer, layerName);
        }
        this.dialogRef.close();
    }

}
