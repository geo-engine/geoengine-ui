import {AfterViewInit, ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';

import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {TimeStepGranularityDict, UUID} from '../../../backend/backend.model';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import moment, {Moment} from 'moment';
import {SymbologyCreatorComponent} from '../../../layers/symbology/symbology-creator/symbology-creator.component';
import {
    RasterDataType,
    RasterDataTypes,
    RasterLayer,
    RasterSymbology,
    ResultTypes,
    TemporalRasterAggregationDict,
    TemporalRasterAggregationDictAgregationType,
    geoengineValidators,
    timeStepGranularityOptions,
} from '@geoengine/common';
import {Workflow as WorkflowDict} from '@geoengine/openapi-client';

interface TemporalRasterAggregationForm {
    name: FormControl<string>;
    layer: FormControl<RasterLayer | undefined>;
    granularity: FormControl<TimeStepGranularityDict>;
    windowSize: FormControl<number>;
    windowReferenceChecked: FormControl<boolean>;
    windowReference: FormControl<Moment>;
    aggregation: FormControl<TemporalRasterAggregationDictAgregationType>;
    percentile: FormControl<number>; // only for `percentileEstimate`
    ignoreNoData: FormControl<boolean>;
    dataType: FormControl<RasterDataType | undefined>;
}

@Component({
    selector: 'geoengine-temporal-raster-aggregation',
    templateUrl: './temporal-raster-aggregation.component.html',
    styleUrls: ['./temporal-raster-aggregation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalRasterAggregationComponent implements AfterViewInit {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    readonly timeGranularityOptions: Array<TimeStepGranularityDict> = timeStepGranularityOptions;
    readonly defaultTimeGranularity: TimeStepGranularityDict = 'months';
    readonly aggregations: Record<TemporalRasterAggregationDictAgregationType, string> = {
        count: 'Count',
        first: 'First',
        last: 'Last',
        max: 'Maximum',
        percentileEstimate: 'Percentile (estimate)',
        mean: 'Mean',
        min: 'Minimum',
        sum: 'Sum',
    };
    readonly defaultAggregation: TemporalRasterAggregationDictAgregationType = 'mean';

    readonly inputDataTypeDisplay$: Observable<string>;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    @ViewChild(SymbologyCreatorComponent)
    readonly symbologyCreator!: SymbologyCreatorComponent;

    form: FormGroup<TemporalRasterAggregationForm>;
    disallowSubmit: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = this.formBuilder.nonNullable.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: new FormControl<RasterLayer | undefined>(undefined, {nonNullable: true, validators: [Validators.required]}),
            granularity: [this.defaultTimeGranularity, [Validators.required]],
            windowSize: [1, [Validators.required, Validators.min(1)]],
            windowReferenceChecked: [false, [Validators.required]],
            windowReference: [moment.utc(0), [Validators.required]],
            aggregation: [this.defaultAggregation, [Validators.required]],
            percentile: [0.5, [Validators.required, geoengineValidators.inRange(0, 1, false, false)]],
            ignoreNoData: [false, [Validators.required]],
            dataType: new FormControl<RasterDataType | undefined>(undefined, {nonNullable: true}),
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));

        this.inputDataTypeDisplay$ = this.form.controls['layer'].valueChanges.pipe(
            mergeMap((layer) => {
                if (!layer) {
                    return of(undefined);
                }

                return this.projectService.getRasterLayerMetadata(layer);
            }),
            map((metadata) => {
                if (!metadata) {
                    return '';
                }

                return `(${metadata.dataType})`;
            }),
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const inputLayer: RasterLayer | undefined = this.form.controls['layer'].value;

        if (!inputLayer) {
            return;
        }

        const outputName: string = this.form.controls['name'].value;

        const aggregation: TemporalRasterAggregationDictAgregationType = this.form.controls['aggregation'].value;
        const granularity: string = this.form.controls['granularity'].value;
        const step: number = this.form.controls['windowSize'].value;
        const dataType: RasterDataType | undefined = this.form.controls['dataType'].value;

        let stepReference: undefined | Moment;
        if (this.form.controls['windowReferenceChecked'].value) {
            stepReference = this.form.get('windowReference')?.value;
        }

        const ignoreNoData: boolean = this.form.controls['ignoreNoData'].value;
        const percentile: number | undefined = aggregation == 'percentileEstimate' ? this.form.controls['percentile'].value : undefined;

        this.loading$.next(true);

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
                                    type: aggregation,
                                    ignoreNoData,
                                    percentile,
                                },
                                window: {
                                    granularity,
                                    step,
                                },
                                windowReference: stepReference,
                                outputType: dataType?.getCode(),
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as TemporalRasterAggregationDict,
                    }),
                ),
                mergeMap((workflowId: UUID) => {
                    const symbology$: Observable<RasterSymbology> = this.symbologyCreator.symbologyForRasterLayer(workflowId, inputLayer);
                    return combineLatest([of(workflowId), symbology$]);
                }),
                mergeMap(([workflowId, symbology]: [UUID, RasterSymbology]) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: outputName,
                            symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    // success
                    this.loading$.next(false);
                },
                error: (error) => {
                    this.notificationService.error(error);
                    this.loading$.next(false);
                },
            });
    }
}
