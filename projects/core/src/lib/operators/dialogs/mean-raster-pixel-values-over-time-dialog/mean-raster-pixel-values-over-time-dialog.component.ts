import {AfterViewInit, ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {concat, Observable} from 'rxjs';
import {MeanRasterPixelValuesOverTimeDict, MeanRasterPixelValuesOverTimeParams, Plot, RasterLayer, ResultTypes} from '@geoengine/common';
import {Workflow as WorkflowDict} from '@geoengine/openapi-client';
import {LayerSelectionComponent} from '../helpers/layer-selection/layer-selection.component';

type TimePosition = 'start' | 'center' | 'end';

interface TimePositionOption {
    value: TimePosition;
    label: string;
}

/**
 * This dialog allows creating a histogram plot of a layer's values.
 */
@Component({
    selector: 'geoengine-mean-raster-pixel-values-over-time-dialog',
    templateUrl: './mean-raster-pixel-values-over-time-dialog.component.html',
    styleUrls: ['./mean-raster-pixel-values-over-time-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeanRasterPixelValuesOverTimeDialogComponent implements AfterViewInit {
    readonly inputTypes = [ResultTypes.RASTER];

    readonly timePositionOptions: Array<TimePositionOption> = [
        {
            value: 'start',
            label: 'Time start',
        },
        {
            value: 'center',
            label: 'In the center between start and end',
        },
        {
            value: 'end',
            label: 'Time end',
        },
    ];

    form: UntypedFormGroup;
    disallowSubmit: Observable<boolean>;

    @ViewChild('layerSelection') layerSelection!: LayerSelectionComponent;

    /**
     * DI for services
     */
    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: UntypedFormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: [undefined, Validators.required],
            timePosition: [this.timePositionOptions[0].value, Validators.required],
            area: [true, Validators.required],
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    /**
     * Uses the user input to create the plot.
     * The plot is added to the plot view.
     */
    add(): void {
        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const timePosition: TimePosition = this.form.controls['timePosition'].value;
        const area: boolean = this.form.controls['area'].value;

        const params: MeanRasterPixelValuesOverTimeParams = {
            timePosition,
            area,
        };

        concat(
            this.projectService.getWorkflow(inputLayer.workflowId).pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'MeanRasterPixelValuesOverTime',
                            params,
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as MeanRasterPixelValuesOverTimeDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addPlot(
                        new Plot({
                            workflowId,
                            name: outputName,
                        }),
                    ),
                ),
            ),
            this.layerSelection.deleteIfSelected(),
        ).subscribe(
            () => {
                // success
            },
            (error) => this.notificationService.error(error),
        );
    }
}
