import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {TimeStepGranularityDict, UUID, WorkflowDict} from '../../../backend/backend.model';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {TemporalRasterAggregationDict} from '../../../backend/operator.model';
import moment, {Moment} from 'moment';
import {SymbologyCreatorComponent} from '../../../layers/symbology/symbology-creator/symbology-creator.component';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {timeStepGranularityOptions} from '../../../time/time.model';

@Component({
    selector: 'geoengine-temporal-raster-aggregation',
    templateUrl: './temporal-raster-aggregation.component.html',
    styleUrls: ['./temporal-raster-aggregation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalRasterAggregationComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];

    readonly timeGranularityOptions: Array<TimeStepGranularityDict> = timeStepGranularityOptions;
    readonly defaultTimeGranularity: TimeStepGranularityDict = 'months';
    readonly aggregations = ['Min', 'Max', 'First', 'Last', 'Mean'];

    readonly loading$ = new BehaviorSubject<boolean>(false);

    @ViewChild(SymbologyCreatorComponent)
    readonly symbologyCreator!: SymbologyCreatorComponent;

    form: UntypedFormGroup;
    disallowSubmit: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: UntypedFormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: [undefined, Validators.required],
            granularity: [this.defaultTimeGranularity, Validators.required],
            windowSize: [1, Validators.required], // TODO: check > 0
            windowReferenceChecked: [false],
            windowReference: [moment.utc(0)],
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
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const aggregation: string = this.form.controls['aggregation'].value;
        const granularity: string = this.form.controls['granularity'].value;
        const step: number = this.form.controls['windowSize'].value;

        let stepReference: undefined | Moment;
        if (this.form.controls['windowReferenceChecked'].value) {
            stepReference = this.form.get('windowReference')?.value;
        }

        const ignoreNoData: boolean = this.form.controls['ignoreNoData'].value;

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
                                    type: aggregation.toLowerCase(),
                                    ignoreNoData,
                                },
                                window: {
                                    granularity,
                                    step,
                                },
                                windowReference: stepReference,
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
