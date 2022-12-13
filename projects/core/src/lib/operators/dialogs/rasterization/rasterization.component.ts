import {Component, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Validators, FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';
import {DensityRasterizationDict, GridRasterizationDict, RasterizationDict} from '../../../backend/operator.model';
import {Subscription} from 'rxjs';
import {NotificationService} from '../../../notification.service';

interface RasterizationForm {
    name: FormControl<string>;
    layer: FormControl<Layer | undefined>;
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
 * This component allows creating the point in polygon filter operator.
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

    constructor(
        private projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private formBuilder: FormBuilder,
    ) {
        const layerControl = new FormControl<Layer | undefined>(undefined, {
            nonNullable: true,
            validators: [Validators.required],
        });
        this.form = new FormGroup<RasterizationForm>({
            name: this.formBuilder.nonNullable.control<string>('Rasterized', [Validators.required, geoengineValidators.notOnlyWhitespace]),
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
        const pointsLayer = this.form.controls['layer'].value as Layer;
        const layerName: string = this.form.controls['name'].value;
        const params = this.rasterizationParams();

        if (!params) {
            return;
        }

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
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: layerName,
                            symbology: RasterSymbology.fromRasterSymbologyDict({
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
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                error: (e) => {
                    this.notificationService.error(e.error.message);
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
