import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {AbstractSymbology} from '../../layers/symbology/symbology.model';
import {Layer} from '../../layers/layer.model';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ProjectService} from '../project.service';

@Component({
    selector: 'wave-workflow-parameter-choice-dialog',
    templateUrl: './workflow-parameter-choice-dialog.component.html',
    styleUrls: ['./workflow-parameter-choice-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowParameterChoiceDialogComponent implements OnInit {

    constructor(private projectService: ProjectService,
                private dialogRef: MatDialogRef<WorkflowParameterChoiceDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public config: { layers: Array<Layer<AbstractSymbology>> }) {
    }

    ngOnInit() {
    }

    append() {
        this.config.layers.forEach(layer => this.projectService.addLayer(layer));
        this.dialogRef.close();
    }

    replace() {
        this.projectService.clearLayers()
            .subscribe(() => this.config.layers.forEach(layer => this.projectService.addLayer(layer)));
        this.dialogRef.close();
    }

    ignore() {
        this.dialogRef.close();
    }

}
