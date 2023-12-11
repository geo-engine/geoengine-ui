import {map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, combineLatest, firstValueFrom, from} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {
    BBoxDict,
    OperatorDict,
    RasterResultDescriptorDict,
    SourceOperatorDict,
    SrsString,
    TimeIntervalDict,
    UUID,
    WorkflowDict,
} from '../../../backend/backend.model';
import {RgbDict, StatisticsDict} from '../../../backend/operator.model';
import {LayoutService, SidenavConfig} from '../../../layout.service';
import {RasterSymbology, SingleBandRasterColorizer} from '../../../layers/symbology/symbology.model';
import {NotificationService} from '../../../notification.service';
import {RgbaColorizer} from '../../../colors/colorizer.model';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';
import {RasterResultDescriptor} from '../../../datasets/dataset.model';
import {SpatialReferenceService} from '../../../spatial-references/spatial-reference.service';
import {extentToBboxDict} from '../../../util/conversions';

interface RgbCompositeForm {
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;

    name: FormControl<string>;

    red: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
    green: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
    blue: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
}

interface RgbRasterStats {
    red: {
        min: number;
        max: number;
    };
    green: {
        min: number;
        max: number;
    };
    blue: {
        min: number;
        max: number;
    };
}

type RgbColorName = 'red' | 'green' | 'blue';

/**
 * This dialog allows calculations on (one or more) raster layers.
 */
@Component({
    selector: 'geoengine-rgb-composite',
    templateUrl: './rgb-composite.component.html',
    styleUrls: ['./rgb-composite.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RgbaCompositeComponent implements AfterViewInit {
    /**
     * If the list is empty, show the following button.
     */
    @Input() dataListConfig?: SidenavConfig;

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly CHANNELS: Array<{color: RgbColorName; label: string}> = [
        {color: 'red', label: 'A'},
        {color: 'green', label: 'B'},
        {color: 'blue', label: 'C'},
    ];
    readonly form: FormGroup<RgbCompositeForm>;

    readonly projectHasRasterLayers$: Observable<boolean>;
    readonly notAllLayersSet$: Observable<boolean>;

    readonly isRasterStatsNotLoading$ = new BehaviorSubject<boolean>(true);

    readonly loading$ = new BehaviorSubject<boolean>(false);

    /**
     * DI of services and setup of observables for the template
     */
    constructor(
        protected readonly projectService: ProjectService,
        protected readonly layoutService: LayoutService,
        protected readonly notificationService: NotificationService,
        protected readonly spatialReferenceService: SpatialReferenceService,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        readonly _formBuilder: FormBuilder,
    ) {
        const formBuilder = _formBuilder.nonNullable;
        this.form = new FormGroup<RgbCompositeForm>({
            rasterLayers: new FormControl<Array<RasterLayer> | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3), Validators.maxLength(3)],
            }),
            name: new FormControl('RGBA', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            red: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
            green: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
            blue: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
        });

        this.projectHasRasterLayers$ = this.projectService
            .getLayerStream()
            .pipe(map((layers: Array<Layer>) => layers.filter((layer) => layer.layerType === 'raster').length > 0));

        this.notAllLayersSet$ = this.form.controls.rasterLayers.valueChanges.pipe(
            map((rasterLayers: Array<RasterLayer> | undefined) => {
                if (!rasterLayers) {
                    return true;
                }

                return rasterLayers.length !== 3;
            }),
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() =>
            this.form.controls['rasterLayers'].updateValueAndValidity({
                onlySelf: false,
                emitEvent: true,
            }),
        );
    }

    /**
     * Uses the user input and creates a new rgb composite operator.
     * The resulting layer is added to the map.
     */
    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const rasterLayers: Array<RasterLayer> | undefined = this.form.controls.rasterLayers.value;

        if (!rasterLayers || rasterLayers.length !== 3) {
            return; // checked by form validator
        }

        const name: string = this.form.controls.name.value;

        const redMin: number = this.form.controls.red.controls.min.value;
        const redMax: number = this.form.controls.red.controls.max.value;
        const redScale: number = this.form.controls.red.controls.scale.value;

        const greenMin: number = this.form.controls.green.controls.min.value;
        const greenMax: number = this.form.controls.green.controls.max.value;
        const greenScale: number = this.form.controls.green.controls.scale.value;

        const blueMin: number = this.form.controls.blue.controls.min.value;
        const blueMax: number = this.form.controls.blue.controls.max.value;
        const blueScale: number = this.form.controls.blue.controls.scale.value;

        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers(rasterLayers);

        const symbology = new RasterSymbology(1, new SingleBandRasterColorizer(0, new RgbaColorizer()));

        sourceOperators
            .pipe(
                tap({next: () => this.loading$.next(true)}),
                mergeMap((operators: Array<OperatorDict | SourceOperatorDict>) => {
                    const workflow: WorkflowDict = {
                        type: 'Raster',
                        operator: {
                            type: 'Rgb',
                            params: {
                                redMin,
                                redMax,
                                redScale,
                                greenMin,
                                greenMax,
                                greenScale,
                                blueMin,
                                blueMax,
                                blueScale,
                            },
                            sources: {
                                red: operators[0],
                                green: operators[1],
                                blue: operators[2],
                            },
                        } as RgbDict,
                    };

                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId: UUID) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    // everything worked well

                    this.loading$.next(false);
                },
                error: (error) => {
                    const errorMsg = error.error.message;
                    this.notificationService.error(errorMsg);

                    this.loading$.next(false);
                },
            });
    }

    goToAddDataTab(): void {
        if (!this.dataListConfig) {
            return;
        }

        this.layoutService.setSidenavContentComponent(this.dataListConfig);
    }

    calculateRasterStats(): void {
        if (this.loading$.value) {
            return; // checked by form validator
        }

        const rasterLayers: Array<RasterLayer> | undefined = this.form.controls.rasterLayers.value;

        if (!rasterLayers || rasterLayers.length !== 3) {
            return; // checked by form validator
        }

        this.isRasterStatsNotLoading$.next(false);

        from(this.queryRasterStats(rasterLayers[0], rasterLayers[1], rasterLayers[2])).subscribe({
            next: (plotData) => {
                this.isRasterStatsNotLoading$.next(true);

                const colors: Array<RgbColorName> = ['red', 'green', 'blue'];

                for (const color of colors) {
                    this.form.controls[color].controls.min.setValue(plotData[color].min);
                    this.form.controls[color].controls.max.setValue(plotData[color].max);
                }

                this.form.updateValueAndValidity();
            },
            error: (error) => {
                const errorMsg = error.error.message;
                this.notificationService.error(errorMsg);

                this.isRasterStatsNotLoading$.next(true);
            },
        });
    }

    protected async queryRasterStats(layerRed: RasterLayer, layerGreen: RasterLayer, layerBlue: RasterLayer): Promise<RgbRasterStats> {
        const [redOperator, greenOperator, blueOperator] = await firstValueFrom(
            this.projectService.getAutomaticallyProjectedOperatorsFromLayers([layerRed, layerGreen, layerBlue]),
        );

        const workflow: WorkflowDict = {
            type: 'Plot',
            operator: {
                type: 'Statistics',
                params: {columnNames: ['red', 'green', 'blue']},
                sources: {
                    source: [redOperator, greenOperator, blueOperator],
                },
            } as StatisticsDict,
        };

        const [workflowId, sessionToken, queryParams] = await firstValueFrom(
            combineLatest([
                this.projectService.registerWorkflow(workflow),
                this.userService.getSessionTokenForRequest(),
                this.estimateQueryParams(redOperator), // we use the red operator to estimate the query params
            ]),
        );

        const plot = await firstValueFrom(this.backend.getPlot(workflowId, queryParams, sessionToken));
        const plotData = plot.data as {
            [name: string]: {
                valueCount: number;
                validCount: number;
                min: number;
                max: number;
                mean: number;
                stddev: number;
            };
        };

        return {
            red: {
                min: plotData.red.min,
                max: plotData.red.max,
            },
            green: {
                min: plotData.green.min,
                max: plotData.green.max,
            },
            blue: {
                min: plotData.blue.min,
                max: plotData.blue.max,
            },
        };
    }

    /**
     * TODO: put function to util or service?
     * A similar function is used in the symbology component
     */
    protected async estimateQueryParams(rasterOperator: OperatorDict | SourceOperatorDict): Promise<{
        bbox: BBoxDict;
        crs: SrsString;
        time: TimeIntervalDict;
        spatialResolution: [number, number];
    }> {
        const rasterWorkflowId = await firstValueFrom(
            this.projectService.registerWorkflow({
                type: 'Raster',
                operator: rasterOperator,
            }),
        );

        const resultDescriptorDict = await firstValueFrom(this.projectService.getWorkflowMetaData(rasterWorkflowId));

        const resultDescriptor = RasterResultDescriptor.fromDict(resultDescriptorDict as RasterResultDescriptorDict);

        let bbox = resultDescriptor.bbox;

        if (!bbox) {
            // if we don't know the bbox of the dataset, we use the projection's whole bbox for guessing the symbology
            // TODO: better use the screen extent?
            bbox = await firstValueFrom(
                this.spatialReferenceService
                    .getSpatialReferenceSpecification(resultDescriptor.spatialReference)
                    .pipe(map((spatialReferenceSpecification) => extentToBboxDict(spatialReferenceSpecification.extent))),
            );
        }

        const time = await firstValueFrom(this.projectService.getTimeOnce());

        // for sampling, we choose a reasonable resolution
        const NUM_PIXELS = 1024;
        const xResolution = (bbox.upperRightCoordinate.x - bbox.lowerLeftCoordinate.x) / NUM_PIXELS;
        const yResolution = (bbox.upperRightCoordinate.y - bbox.lowerLeftCoordinate.y) / NUM_PIXELS;
        return {
            bbox,
            crs: resultDescriptor.spatialReference,
            time: time.toDict(),
            spatialResolution: [xResolution, yResolution],
        };
    }
}
