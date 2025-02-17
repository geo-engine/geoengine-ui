import {Component, OnInit, ChangeDetectionStrategy, Inject} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../project/project.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Layer} from '@geoengine/common';

@Component({
    selector: 'geoengine-rename-layer',
    templateUrl: './rename-layer.component.html',
    styleUrls: ['./rename-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class RenameLayerComponent implements OnInit {
    form: UntypedFormGroup;

    private layer?: Layer;

    constructor(
        private projectService: ProjectService,
        private formBuilder: UntypedFormBuilder,
        private dialogRef: MatDialogRef<RenameLayerComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {layer?: Layer},
    ) {
        this.form = this.formBuilder.group({
            layerName: [undefined, Validators.required],
        });
    }

    ngOnInit(): void {
        this.layer = this.config.layer;
        this.form.controls['layerName'].setValue(this.layer?.name);
    }

    /**
     * Save the layer name and close the dialog.
     */
    save(): void {
        if (!this.layer || !this.form) {
            return;
        }

        const layerName = this.form.controls['layerName'].value;
        if (layerName === this.layer.name) {
            return;
        }

        this.projectService.changeLayer(this.layer, {name: layerName}).subscribe(
            () => this.dialogRef.close(),
            (_error) => {
                // TODO: handle error
            },
        );
    }
}
