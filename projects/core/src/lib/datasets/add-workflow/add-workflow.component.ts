import {Component, ChangeDetectionStrategy} from '@angular/core';
import {UntypedFormGroup, UntypedFormControl, Validators} from '@angular/forms';
import {UUID} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {RandomColorService} from '../../util/services/random-color.service';
import {isValidUuid} from '@geoengine/common';
import {DatasetService} from "../dataset.service";

@Component({
    selector: 'geoengine-add-workflow',
    templateUrl: './add-workflow.component.html',
    styleUrls: ['./add-workflow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWorkflowComponent {
    readonly form: UntypedFormGroup;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly notificationService: NotificationService,
        protected readonly randomColorService: RandomColorService,
        protected readonly datasetService: DatasetService,
    ) {
        this.form = new UntypedFormGroup({
            layerName: new UntypedFormControl('New Layer', Validators.required),
            workflowId: new UntypedFormControl('', [Validators.required, isValidUuid]),
        });
    }

    add(): void {
        const layerName: string = this.form.controls.layerName.value;
        const workflowId: UUID = this.form.controls.workflowId.value;

        this.datasetService.createLayerFromWorkflow(layerName, workflowId).subscribe(
            layer => {
                this.projectService.addLayer(layer);
            },
            error => {
                let errorMessage = `No workflow found for id: ${workflowId}`;

                if ("error" in error) {
                    if (error.error !== 'NoWorkflowForGivenId') {
                        errorMessage = `Unknown error -> ${error.error}: ${error.message}`;
                    }
                } else {
                    errorMessage = error.message;
                }
                this.notificationService.error(errorMessage);
            }
        );
    }
}
