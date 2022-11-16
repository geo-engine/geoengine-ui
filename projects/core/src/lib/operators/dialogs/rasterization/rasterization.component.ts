import {Component, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {RandomColorService} from '../../../util/services/random-color.service';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Validators, FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {geoengineValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap} from 'rxjs/operators';
import {WorkflowDict} from '../../../backend/backend.model';
import {DensityRasterizationDict, GridRasterizationDict, RasterizationDict} from '../../../backend/operator.model';
import {Subscription} from 'rxjs';

interface RasterizationForm {
    name: FormControl<string>;
    layer: FormControl<Layer | undefined>;
    rasterization: FormGroup<DensityForm> | FormGroup<GridForm>;
}

type RasterizationType = 'grid' | 'density';

interface GridOrDensityForm {
    gridOrDensity: FormControl<RasterizationType>;
}
interface GridForm extends GridOrDensityForm {
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

    constructor(private randomColorService: RandomColorService, private projectService: ProjectService, private formBuilder: FormBuilder) {
        const layerControl = new FormControl<Layer | undefined>(undefined, {
            nonNullable: true,
            validators: [Validators.required],
        });
        this.form = new FormGroup<RasterizationForm>({
            name: this.formBuilder.nonNullable.control<string>('Rasterized', [Validators.required, geoengineValidators.notOnlyWhitespace]),
            layer: layerControl,
            rasterization: this.defaultGrid(),
        });
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    defaultGrid(): FormGroup<GridForm> {
        const fb = this.formBuilder.nonNullable;
        const gridMode = fb.control<'fixed' | 'relative'>('fixed');
        return fb.group<GridForm>({
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

    defaultDensity(): FormGroup<DensityForm> {
        return this.formBuilder.nonNullable.group<DensityForm>({
            gridOrDensity: this.createRasterizationType('density'),
            radius: this.formBuilder.nonNullable.control<number>(10.0, Validators.required),
            stddev: this.formBuilder.nonNullable.control<number>(10.0, Validators.required),
        });
    }

    protected createRasterizationType<T extends RasterizationType>(name: T): FormControl<T> {
        const fb = this.formBuilder.nonNullable;
        const rasterType = fb.control<T>(name, Validators.required);
        this.subscriptions.push(rasterType.valueChanges.subscribe((value) => this.changeRasterization(value)));
        return rasterType;
    }

    protected changeRasterization(rasterization: string): void {
        if (rasterization === 'grid') {
            this.form.setControl('rasterization', this.defaultGrid());
        } else if (rasterization === 'density') {
            this.form.setControl('rasterization', this.defaultDensity());
        }
    }

    add(): void {
        const pointsLayer = this.form.controls['layer'].value as Layer;

        const name: string = this.form.controls['name'].value;
        //TODO
        const rasterization = this.form.controls.rasterization.value;
        let radiuss = 0;
        let stddevs = 0;
        if (rasterization.gridOrDensity === 'density') {
            radiuss = rasterization.radius ? rasterization.radius : 0;
            stddevs = rasterization.stddev ? rasterization.stddev : 0;
        }

        //TODO
        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers([pointsLayer]);

        sourceOperators
            .pipe(
                map(([points]) => {
                    var workflow;
                    if (rasterization.gridOrDensity === 'grid') {
                        workflow = {
                            type: 'Raster',
                            operator: {
                                type: 'Rasterization',
                                params: {
                                    gridOrDensity: {
                                        type: 'grid',
                                        spatialResolution: {
                                            x: rasterization?.resolution?.resX,
                                            y: rasterization?.resolution?.resY,
                                        },
                                        gridSizeMode: rasterization.gridSizeMode,
                                        originCoordinate: {
                                            x: rasterization?.origin?.originX,
                                            y: rasterization?.origin?.originY,
                                        },
                                    } as GridRasterizationDict,
                                },
                                sources: {
                                    vector: points,
                                },
                            } as RasterizationDict,
                        } as WorkflowDict;
                    } else {
                        workflow = {
                            type: 'Raster',
                            operator: {
                                type: 'Rasterization',
                                params: {
                                    gridOrDensity: {
                                        type: 'density',
                                        radius: radiuss,
                                        stddev: stddevs,
                                    } as DensityRasterizationDict,
                                },
                                sources: {
                                    vector: points,
                                },
                            } as RasterizationDict,
                        } as WorkflowDict;
                    }

                    this.projectService
                        .registerWorkflow(workflow)
                        .pipe(
                            mergeMap((workflowId) =>
                                this.projectService.addLayer(
                                    new RasterLayer({
                                        workflowId,
                                        name: name,
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
                }),
            )
            .subscribe();
    }
}
