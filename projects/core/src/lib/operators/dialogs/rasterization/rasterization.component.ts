import {Component, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Validators, FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {BBoxDict, RasterResultDescriptorDict, SrsString, TimeIntervalDict, UUID, WorkflowDict} from '../../../backend/backend.model';
import {
    DensityRasterizationDict,
    GridRasterizationDict,
    RasterizationDict,
    StatisticsDict,
    StatisticsParams,
} from '../../../backend/operator.model';
import {BehaviorSubject, combineLatest, first, map, Observable, of, Subscription} from 'rxjs';
import {NotificationService} from '../../../notification.service';
import {RasterResultDescriptor} from '../../../datasets/dataset.model';
import {extentToBboxDict} from '../../../util/conversions';
import {Time} from '../../../time/time.model';
import {ColorMapSelectorComponent} from '../../../colors/color-map-selector/color-map-selector.component';
import {MPL_COLORMAPS} from '../../../colors/color-map-selector/mpl-colormaps';
import {LinearGradient} from '../../../colors/colorizer.model';
import {TRANSPARENT} from '../../../colors/color';
import {SpatialReferenceService} from '../../../spatial-references/spatial-reference.service';
import {UserService} from '../../../users/user.service';
import {BackendService} from '../../../backend/backend.service';

interface RasterizationForm {
    name: FormControl<string>;
    layer: FormControl<Layer | undefined>;
    computeSymbology: FormControl<boolean>;
    rasterization: FormGroup<DensityForm> | FormGroup<GridForm>;
}

interface GridForm {
    gridOrDensity: FormControl<number>;
    gridSizeMode: FormControl<'fixed' | 'relative'>;
    resolution: FormGroup<{
        resX: FormControl<number>;
        resY: FormControl<number>;
    }>;
    origin: FormGroup<{
        originX: FormControl<number>;
        originY: FormControl<number>;
    }>;
}
interface DensityForm {
    gridOrDensity: FormControl<number>;
    cutoff: FormControl<number>;
    stddev: FormControl<number>;
}
/**
 * This component allows creating the rasterization operator.
 */
@Component({
    selector: 'geoengine-rasterization',
    templateUrl: './rasterization.component.html',
    styleUrls: ['./rasterization.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterizationComponent implements OnDestroy {
    selected = new FormControl(0, {validators: [Validators.required], nonNullable: true});

    readonly inputTypes = [ResultTypes.POINTS];

    readonly form: FormGroup<RasterizationForm>;
    readonly subscriptions: Array<Subscription> = [];

    readonly loading$ = new BehaviorSubject<boolean>(false);

    constructor(
        private projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly spatialReferenceService: SpatialReferenceService,
        private readonly userService: UserService,
        private readonly backendService: BackendService,
        private formBuilder: FormBuilder,
    ) {
        const layerControl = new FormControl<Layer | undefined>(undefined, {
            nonNullable: true,
            validators: [Validators.required],
        });
        this.form = new FormGroup<RasterizationForm>({
            name: this.formBuilder.nonNullable.control<string>('Rasterized', [Validators.required, geoengineValidators.notOnlyWhitespace]),
            computeSymbology: this.formBuilder.nonNullable.control<boolean>(true, []),
            layer: layerControl,
            rasterization: this.initialGrid(),
        });
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    initialGrid(): FormGroup<GridForm> {
        const fb = this.formBuilder.nonNullable;
        const gridMode = fb.control<'fixed' | 'relative'>('fixed');
        return fb.group<GridForm>({
            gridOrDensity: this.createRasterizationType(0),
            gridSizeMode: gridMode,
            resolution: this.formBuilder.group({
                resX: fb.control<number>(10.0, {validators: [Validators.required, geoengineValidators.largerThan(0)]}),
                resY: fb.control<number>(10.0, {validators: [Validators.required, geoengineValidators.largerThan(0)]}),
            }),
            origin: this.formBuilder.group({
                originX: fb.control<number>(0.0, Validators.required),
                originY: fb.control<number>(0.0, Validators.required),
            }),
        });
    }

    initialDensity(): FormGroup<DensityForm> {
        return this.formBuilder.nonNullable.group<DensityForm>({
            gridOrDensity: this.createRasterizationType(1),
            cutoff: this.formBuilder.nonNullable.control<number>(0.01, {
                validators: [Validators.required, geoengineValidators.inRange(0, 1, true, false)],
            }),
            stddev: this.formBuilder.nonNullable.control<number>(1.0, {
                validators: [Validators.required, geoengineValidators.largerThan(0)],
            }),
        });
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const pointsLayer = this.form.controls['layer'].value as Layer;
        const layerName: string = this.form.controls['name'].value;
        const computeSymbology: boolean = this.form.controls['computeSymbology'].value;
        const params = this.rasterizationParams();

        if (!params) {
            return;
        }

        this.loading$.next(true);

        this.projectService
            .getAutomaticallyProjectedOperatorsFromLayers([pointsLayer])
            .pipe(
                mergeMap(([points]) => {
                    const workflow: WorkflowDict = {
                        type: 'Raster',
                        operator: {
                            type: 'Rasterization',
                            params: {
                                gridOrDensity: params,
                            },
                            sources: {
                                vector: points,
                            },
                        } as RasterizationDict,
                    } as WorkflowDict;
                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId: UUID) => {
                    const symbology$: Observable<RasterSymbology> = computeSymbology
                        ? this.computeSymbologyForRasterLayer(workflowId)
                        : this.defaultSymbology();
                    return combineLatest([of(workflowId), symbology$]);
                }),
                mergeMap(([workflowId, symbology]: [UUID, RasterSymbology]) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: layerName,
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

    protected createRasterizationType(selectedIndex: number): FormControl<number> {
        this.selected = this.formBuilder.nonNullable.control<number>(selectedIndex);
        const rasterType = this.selected;
        this.subscriptions.push(rasterType.valueChanges.subscribe((value) => this.changeRasterization(value)));
        return rasterType;
    }

    protected changeRasterization(rasterization: number): void {
        if (rasterization === 0) {
            this.form.setControl('rasterization', this.initialGrid());
        } else if (rasterization === 1) {
            this.form.setControl('rasterization', this.initialDensity());
        }
    }

    private defaultSymbology(): Observable<RasterSymbology> {
        return of(
            RasterSymbology.fromRasterSymbologyDict({
                type: 'raster',
                opacity: 0.8,
                colorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 0, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    defaultColor: [0, 0, 0, 255],
                    noDataColor: [0, 0, 0, 255],
                },
            }),
        );
    }

    private computeSymbologyForRasterLayer(workflowId: UUID): Observable<RasterSymbology> {
        const rasterName = 'raster';

        const statisticsWorkflow$ = this.projectService.getWorkflow(workflowId).pipe(
            mergeMap((workflow) =>
                this.projectService.registerWorkflow({
                    type: 'Plot',
                    operator: {
                        type: 'Statistics',
                        params: {
                            columnNames: [rasterName],
                        } as StatisticsParams,
                        sources: {
                            source: [workflow['operator']],
                        },
                    } as StatisticsDict,
                }),
            ),
        );

        const queryParams$: Observable<{
            bbox: BBoxDict;
            crs: SrsString;
            time: TimeIntervalDict;
            spatialResolution: [number, number];
        }> = combineLatest([
            this.projectService
                .getWorkflowMetaData(workflowId)
                .pipe(map((resultDescriptor) => RasterResultDescriptor.fromDict(resultDescriptor as RasterResultDescriptorDict))),
            this.projectService.getTimeOnce(),
        ]).pipe(
            mergeMap(([resultDescriptor, time]) =>
                combineLatest([
                    // if we don't know the bbox of the dataset, we use the projection's whole bbox for guessing the symbology
                    // TODO: better use the screen extent?
                    resultDescriptor.bbox
                        ? of(resultDescriptor.bbox)
                        : this.spatialReferenceService
                              .getSpatialReferenceSpecification(resultDescriptor.spatialReference)
                              .pipe(map((spatialReferenceSpecification) => extentToBboxDict(spatialReferenceSpecification.extent))),
                    of(resultDescriptor.spatialReference),
                    of(time),
                ]),
            ),
            map(([bbox, crs, time]: [BBoxDict, SrsString, Time]) => {
                // for sampling, we choose a reasonable resolution
                const NUM_PIXELS = 1024;
                const xResolution = (bbox.upperRightCoordinate.x - bbox.lowerLeftCoordinate.x) / NUM_PIXELS;
                const yResolution = (bbox.upperRightCoordinate.y - bbox.lowerLeftCoordinate.y) / NUM_PIXELS;
                return {
                    bbox,
                    crs,
                    time: time.toDict(),
                    spatialResolution: [xResolution, yResolution],
                };
            }),
        );

        return combineLatest([statisticsWorkflow$, queryParams$, this.userService.getSessionOnce()]).pipe(
            first(),
            mergeMap(([statisticsWorkflow, queryParams, session]) =>
                this.backendService.getPlot(statisticsWorkflow, queryParams, session.sessionToken),
            ),
            map((plot) => {
                if (plot.plotType !== 'Statistics') {
                    throw new Error('Expected `Statistics` plot.');
                }

                return plot.data as {
                    [name: string]: {
                        valueCount: number;
                        validCount: number;
                        min: number;
                        max: number;
                        mean: number;
                        stddev: number;
                    };
                };
            }),
            map((statistics) => {
                const NUMBER_OF_COLOR_STEPS = 16;
                const REVERSE_COLORS = false;

                const min = statistics[rasterName].min;
                const max = statistics[rasterName].max;

                if (min === null || min === undefined || max === null || max === undefined) {
                    throw new Error('Sample statistics do not have valid min/max values.');
                }

                const breakpoints = ColorMapSelectorComponent.createLinearBreakpoints(
                    MPL_COLORMAPS.INFERNO,
                    NUMBER_OF_COLOR_STEPS,
                    REVERSE_COLORS,
                    {
                        min,
                        max,
                    },
                );
                const colorizer = new LinearGradient(
                    breakpoints,
                    TRANSPARENT,
                    TRANSPARENT, // TODO: set under/over color to first and last breakpoint when avaialble
                );
                return new RasterSymbology(0.8, colorizer);
            }),
        );
    }

    private rasterizationParams(): GridRasterizationDict | DensityRasterizationDict | null {
        let params: GridRasterizationDict | DensityRasterizationDict | null = null;
        let rasterization = this.form.controls.rasterization;

        if (this.selected.value === 0) {
            rasterization = this.form.controls.rasterization as FormGroup<GridForm>;

            return (params = {
                type: 'grid',
                spatialResolution: {
                    x: rasterization?.value.resolution?.resX ?? 10,
                    y: rasterization?.value.resolution?.resY ?? 10,
                },
                gridSizeMode: rasterization?.value.gridSizeMode ?? 'fixed',
                originCoordinate: {
                    x: rasterization?.value.origin?.originX ?? 0,
                    y: rasterization?.value.origin?.originY ?? 0,
                },
            });
        }

        if (this.selected.value === 1) {
            rasterization = this.form.controls.rasterization as FormGroup<DensityForm>;

            return (params = {
                type: 'density',
                cutoff: rasterization?.value.cutoff ?? 10,
                stddev: rasterization?.value.stddev ?? 10,
            });
        }
        return params;
    }
}
