import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {Symbology} from '../../layers/symbology/symbology.model';
import {Layer} from '../../layers/layer.model';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {ProjectService} from '../project.service';

@Component({
    selector: 'wave-workflow-parameter-choice-dialog',
    templateUrl: './workflow-parameter-choice-dialog.component.html',
    styleUrls: ['./workflow-parameter-choice-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowParameterChoiceDialogComponent implements OnInit {

    constructor(private projectService: ProjectService,
                private dialogRef: MdDialogRef<WorkflowParameterChoiceDialogComponent>,
                @Inject(MD_DIALOG_DATA) private config: { layer: Layer<Symbology> }) {
    }

    ngOnInit() {
    }

    append() {
        this.projectService.addLayer(this.config.layer);
        this.dialogRef.close();
    }

    replace() {
        this.projectService.clearLayers()
            .subscribe(() => this.projectService.addLayer(this.config.layer));
        this.dialogRef.close();
    }

    ignore() {
        this.dialogRef.close();
    }

}
