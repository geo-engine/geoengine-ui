import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {NotificationService} from '../../../notification.service';
import {OperatorParams, WorkflowDict} from '../../../backend/backend.model';
import {Observable} from 'rxjs';

interface MeanRasterPixelValuesOverTimeParams extends OperatorParams {
    time_position: TimePosition;
    area: boolean;
}

type TimePosition = 'start' | 'center' | 'end';

interface TimePositionOption {
    value: TimePosition;
    label: string;
}

/**
 * This dialog allows creating a histogram plot of a layer's values.
 */
@Component({
    selector: 'wave-mean-raster-pixel-values-over-time-dialog',
    templateUrl: './mean-raster-pixel-values-over-time-dialog.component.html',
    styleUrls: ['./mean-raster-pixel-values-over-time-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeanRasterPixelValuesOverTimeDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];

    readonly timePositionOptions: Array<TimePositionOption> = [{
        value: 'start',
        label: 'Time start',
    }, {
        value: 'center',
        label: 'In the center between start and end',
    }, {
        value: 'end',
        label: 'Time end',
    }];

    form: FormGroup;
    disallowSubmit: Observable<boolean>;

    /**
     * DI for services
     */
    constructor(private readonly projectService: ProjectService,
                private readonly notificationService: NotificationService,
                private readonly formBuilder: FormBuilder) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            layer: [undefined, Validators.required],
            timePosition: [this.timePositionOptions[0].value, Validators.required],
            area: [true, Validators.required],
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map(status => status !== 'VALID'));
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ngOnDestroy() {
    }

    /**
     * Uses the user input to create the plot.
     * The plot is added to the plot view.
     */
    add() {
        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const timePosition: TimePosition = this.form.controls['timePosition'].value;
        const area: boolean = this.form.controls['area'].value;

        const params: MeanRasterPixelValuesOverTimeParams = {
            time_position: timePosition,
            area,
        };

        this.projectService.getWorkflow(inputLayer.workflowId).pipe(
            mergeMap((inputWorkflow: WorkflowDict) => this.projectService.registerWorkflow({
                type: 'Plot',
                operator: {
                    type: 'MeanRasterPixelValuesOverTime',
                    params,
                    raster_sources: [inputWorkflow.operator],
                    vector_sources: [],
                }
            })),
            mergeMap(workflowId => this.projectService.addPlot(new Plot({
                workflowId,
                name: outputName,
            }))),
        ).subscribe(
            () => {
                // success
            },
            error => this.notificationService.error(error),
        );
    }

}
