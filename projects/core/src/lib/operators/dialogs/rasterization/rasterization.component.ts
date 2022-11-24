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

interface RasterizationForm {
    name: FormControl<string>;
    layer: FormControl<Layer | undefined>;
    rasterization: FormGroup<DensityForm> | FormGroup<GridForm>;
}

// for Tab UI:
// type RasterizationType = 0 | 1;
type RasterizationType = 'grid' | 'density';

interface GridOrDensityForm {
    gridOrDensity: FormControl<RasterizationType>;
}
interface GridForm extends GridOrDensityForm {
    // for Tab UI:
    // gridOrDensity: FormControl<0>;
    gridOrDensity: FormControl<'grid'>;
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
interface DensityForm extends GridOrDensityForm {
    // for Tab UI:
    // gridOrDensity: FormControl<1>;
    gridOrDensity: FormControl<'density'>;
    radius: FormControl<number>;
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
    readonly inputTypes = [ResultTypes.POINTS];

    readonly form: FormGroup<RasterizationForm>;
    readonly subscriptions: Array<Subscription> = [];

    constructor(private projectService: ProjectService, private formBuilder: FormBuilder) {
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
            // for Tab UI:
            // gridOrDensity: this.createRasterizationType(0),
            gridOrDensity: this.createRasterizationType('grid'),
            gridSizeMode: gridMode,
            resolution: this.formBuilder.group({
                resX: fb.control<number>(10.0, Validators.required),
                resY: fb.control<number>(10.0, Validators.required),
            }),
            origin: this.formBuilder.group({
                originX: fb.control<number>(0.0, Validators.required),
                originY: fb.control<number>(0.0, Validators.required),
            }),
        });
    }

    initialDensity(): FormGroup<DensityForm> {
        return this.formBuilder.nonNullable.group<DensityForm>({
            // for Tab UI:
            // gridOrDensity: this.createRasterizationType(1),
            gridOrDensity: this.createRasterizationType('density'),
            radius: this.formBuilder.nonNullable.control<number>(10.0, Validators.required),
            stddev: this.formBuilder.nonNullable.control<number>(10.0, Validators.required),
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
            .subscribe();
    }

    // for Tab UI:
    // protected createRasterizationType<T extends RasterizationType>(selectedIndex: T): FormControl<T> {
    protected createRasterizationType<T extends RasterizationType>(name: T): FormControl<T> {
        const fb = this.formBuilder.nonNullable;
        // for Tab UI:
        // const rasterType = fb.control<T>(selectedIndex, Validators.required);
        const rasterType = fb.control<T>(name, Validators.required);
        this.subscriptions.push(rasterType.valueChanges.subscribe((value) => this.changeRasterization(value)));
        return rasterType;
    }
    // for Tab UI:
    // protected changeRasterization(rasterization: number): void {
    protected changeRasterization(rasterization: string): void {
        // for Tab UI:
        // if (rasterization === 0) {
        //     this.form.setControl('rasterization', this.initialGrid());
        // } else if (rasterization === 1) {
        //     this.form.setControl('rasterization', this.initialDensity());
        // }
        if (rasterization === 'grid') {
            this.form.setControl('rasterization', this.initialGrid());
        } else if (rasterization === 'density') {
            this.form.setControl('rasterization', this.initialDensity());
        }
    }

    private rasterizationParams(): GridRasterizationDict | DensityRasterizationDict | null {
        const rasterization = this.form.controls.rasterization.value;
        let params: GridRasterizationDict | DensityRasterizationDict | null = null;
        if (rasterization.gridOrDensity === 'grid') {
            // for Tab UI:
            // if (rasterization.gridOrDensity === 0) {
            return (params = {
                type: 'grid',
                spatialResolution: {
                    x: rasterization?.resolution?.resX ?? 10,
                    y: rasterization?.resolution?.resY ?? 10,
                },
                gridSizeMode: rasterization?.gridSizeMode ?? 'fixed',
                originCoordinate: {
                    x: rasterization?.origin?.originX ?? 0,
                    y: rasterization?.origin?.originY ?? 0,
                },
            });
        }
        // for Tab UI:
        // if (rasterization.gridOrDensity === 1) {
        if (rasterization.gridOrDensity === 'density') {
            return (params = {
                type: 'density',
                radius: rasterization?.radius ?? 10,
                stddev: rasterization?.stddev ?? 10,
            });
        }
        return params;
    }
}
