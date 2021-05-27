import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {WorkflowDict} from '../../../backend/backend.model';
import {Observable, Subscription} from 'rxjs';
import {TemporalRasterAggregationDict} from '../../../backend/operator.model';

@Component({
    selector: 'wave-temporal-raster-aggregation',
    templateUrl: './temporal-raster-aggregation.component.html',
    styleUrls: ['./temporal-raster-aggregation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalRasterAggregationComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];

    readonly timeGranularityOptions = ['Millis', 'Seconds', 'Minutes', 'Hours', 'Days', 'Months', 'Years'];
    readonly aggregations = ['Min', 'Max', 'First', 'Last'];

    form: FormGroup;
    disallowSubmit: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            layer: [undefined, Validators.required],
            granularity: ['Months', Validators.required],
            windowSize: [1, Validators.required], // TODO: check > 0
            aggregation: [this.aggregations[0], Validators.required],
            ignoreNoData: [false],
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {}

    add(): void {
        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const aggregation: string = this.form.controls['aggregation'].value;
        const granularity: string = this.form.controls['granularity'].value;
        const step: number = this.form.controls['windowSize'].value;
        const ignoreNoData: boolean = this.form.controls['ignoreNoData'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'TemporalRasterAggregation',
                            params: {
                                aggregation: {
                                    type: aggregation.toLowerCase(),
                                    ignoreNoData,
                                },
                                window: {
                                    granularity,
                                    step,
                                },
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as TemporalRasterAggregationDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: outputName,
                            symbology: inputLayer.symbology.clone(),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe(
                () => {
                    // success
                },
                (error) => this.notificationService.error(error),
            );
    }
}
