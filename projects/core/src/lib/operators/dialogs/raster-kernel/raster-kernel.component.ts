import {map, mergeMap} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {ProjectService} from '../../../project/project.service';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {RasterKernelDict} from '../../../backend/operator.model';
import {LayoutService, SidenavConfig} from '../../../layout.service';
import {geoengineValidators} from '../../../util/form.validators';

interface RasterKernelForm {
    rasterLayer: FormControl<RasterLayer | undefined>;
    kernelType: FormControl<'convolution' | 'standardDeviation'>;
    kernel: FormControl<KernelForm>;
    name: FormControl<string>;
}

interface KernelForm {
    type: string;
}

interface ConvolutionKernelForm extends KernelForm {
    type: 'convolution';
    matrix: Array<Array<number>>;
}

interface StandardDeviationForm extends KernelForm {
    type: 'standardDeviation';
    dimensions: [number, number];
}

/**
 * The dialog for applying a `RasterKernel` operator.
 */
@Component({
    selector: 'geoengine-raster-kernel',
    templateUrl: './raster-kernel.component.html',
    styleUrls: ['./raster-kernel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterKernelComponent implements AfterViewInit, OnDestroy {
    /**
     * If the inputs are empty, show the following button.
     */
    @Input() dataListConfig?: SidenavConfig;

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly form: FormGroup<RasterKernelForm>;

    readonly lastError$ = new BehaviorSubject<string | undefined>(undefined);

    readonly projectHasRasterLayers$: Observable<boolean>;

    readonly subscriptions: Array<Subscription> = [];

    /**
     * DI of services and setup of observables for the template
     */
    constructor(protected readonly projectService: ProjectService, protected readonly layoutService: LayoutService) {
        this.form = new FormGroup<RasterKernelForm>({
            rasterLayer: new FormControl<RasterLayer | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            kernelType: new FormControl('convolution', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            kernel: new FormControl<ConvolutionKernelForm | StandardDeviationForm>(
                {
                    type: 'convolution',
                    matrix: [
                        [1.0, 0.0, -1.0],
                        [2.0, 0.0, -2.0],
                        [1.0, 0.0, -1.0],
                    ],
                },
                {
                    nonNullable: true,
                    validators: [Validators.required, correctKernelDimensions],
                },
            ),
            name: new FormControl('Raster Kernel', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
        });

        this.subscriptions.push(
            this.form.controls.kernelType.valueChanges.subscribe((dataType) => {
                if (dataType === 'convolution') {
                    this.form.controls.kernel.setValue({
                        type: 'convolution',
                        matrix: [
                            [1.0, 0.0, -1.0],
                            [2.0, 0.0, -2.0],
                            [1.0, 0.0, -1.0],
                        ],
                    } as ConvolutionKernelForm);
                } else if (dataType === 'standardDeviation') {
                    this.form.controls.kernel.setValue({
                        type: 'standardDeviation',
                        dimensions: [3, 3],
                    } as StandardDeviationForm);
                }
            }),
        );

        this.projectHasRasterLayers$ = this.projectService
            .getLayerStream()
            .pipe(map((layers: Array<Layer>) => layers.filter((layer) => layer.layerType === 'raster').length > 0));
    }

    ngAfterViewInit(): void {
        setTimeout(() =>
            this.form.controls['rasterLayer'].updateValueAndValidity({
                onlySelf: false,
                emitEvent: true,
            }),
        );
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    getMatrix(): Array<Array<number>> {
        const kernel = this.form.controls.kernel.value as ConvolutionKernelForm;

        if (kernel.type !== 'convolution') {
            return [];
        }

        return kernel.matrix;
    }

    setMatrixValue(row: number, col: number, value: number): void {
        const matrix = this.getMatrix();

        if (matrix.length <= row || matrix[0].length <= col) {
            return;
        }

        matrix[row][col] = value;
    }

    enlargeMatrix(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: increaseMatrix(this.getMatrix()),
        } as ConvolutionKernelForm);
    }

    smallenMatrix(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: decreaseMatrix(this.getMatrix()),
        } as ConvolutionKernelForm);
    }

    rotate90(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: rotateMatrixClockwise(this.getMatrix()),
        } as ConvolutionKernelForm);
    }

    presetSobel(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: [
                [1.0, 0.0, -1.0],
                [2.0, 0.0, -2.0],
                [1.0, 0.0, -1.0],
            ],
        } as ConvolutionKernelForm);
    }

    presetMean(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: [
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
            ],
        } as ConvolutionKernelForm);
    }

    presetGaussianBlur(): void {
        this.form.controls.kernel.setValue({
            type: 'convolution',
            matrix: [
                [0.003, 0.0133, 0.0219, 0.0133, 0.003],
                [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
                [0.0219, 0.0983, 0.1621, 0.0983, 0.0219],
                [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
                [0.003, 0.0133, 0.0219, 0.0133, 0.003],
            ],
        } as ConvolutionKernelForm);
    }

    setDimensionValue(dimension: number, value: number): void {
        const dimensions = this.getDimensions();
        dimensions[dimension] = value;

        this.form.controls.kernel.setValue({
            type: 'standardDeviation',
            dimensions,
        } as StandardDeviationForm);
    }

    getDimensions(): [number, number] {
        const kernel = this.form.controls.kernel.value as StandardDeviationForm;

        if (kernel.type !== 'standardDeviation') {
            return [0, 0];
        }

        return kernel.dimensions;
    }

    /**
     * Uses the user input and creates a new expression operator.
     * The resulting layer is added to the map.
     */
    add(): void {
        const name: string = this.form.controls['name'].value;
        const rasterLayer: RasterLayer | undefined = this.form.controls['rasterLayer'].value;
        const kernel: KernelForm = this.form.controls['kernel'].value;

        if (!rasterLayer) {
            return; // checked by form validator
        }

        this.projectService
            .getAutomaticallyProjectedOperatorsFromLayers([rasterLayer])
            .pipe(
                mergeMap(([raster]) => {
                    const workflow: WorkflowDict = {
                        type: 'Raster',
                        operator: {
                            type: 'RasterKernel',
                            params: {
                                kernel,
                            },
                            sources: {
                                raster,
                            },
                        } as RasterKernelDict,
                    };

                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId: UUID) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            // copy symbology from input layer
                            symbology: rasterLayer.symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    // everything worked well

                    this.lastError$.next(undefined);
                },
                error: (error) => {
                    const errorMsg = error.error.message;

                    this.lastError$.next(errorMsg);
                },
            });
    }

    goToAddDataTab(): void {
        if (!this.dataListConfig) {
            return;
        }

        this.layoutService.setSidenavContentComponent(this.dataListConfig);
    }
}

/**
 * Increase matrix by one column and row.
 * Copy the previous matrix into the center, fill the rest with zeros.
 */
export function increaseMatrix(matrix: Array<Array<number>>): Array<Array<number>> {
    const halfPadding = 1;

    const rows = matrix.length;
    const cols = rows > 0 ? matrix[0].length : 0;

    const newMatrix: Array<Array<number>> = [];

    for (let r = 0; r < rows + 2 * halfPadding; ++r) {
        const newRow: Array<number> = [];

        for (let c = 0; c < cols + 2 * halfPadding; ++c) {
            if (r < halfPadding || r > rows || c < halfPadding || c > cols) {
                newRow.push(0);
            } else {
                newRow.push(matrix[r - halfPadding][c - halfPadding]);
            }
        }

        newMatrix.push(newRow);
    }
    return newMatrix;
}

/**
 * Decrease matrix by one column and row.
 * Copy the previous matrix into the center, omit the outer ring.
 *
 * Do nothing if matrix is already 1x1.
 */
export function decreaseMatrix(matrix: Array<Array<number>>): Array<Array<number>> {
    const halfPadding = 1;

    const rows = matrix.length;
    const cols = rows > 0 ? matrix[0].length : 0;

    if (rows <= 1 || cols <= 1) {
        return matrix;
    }

    const newMatrix: Array<Array<number>> = [];

    for (let r = halfPadding; r < rows - halfPadding; ++r) {
        newMatrix.push([]);
        for (let c = halfPadding; c < cols - halfPadding; ++c) {
            newMatrix[r - 1].push(matrix[r][c]);
        }
    }
    return newMatrix;
}

/**
 * Rotate the matrix by 90 degrees.
 */
export function rotateMatrixClockwise(matrix: Array<Array<number>>): Array<Array<number>> {
    const rows = matrix.length;
    const cols = rows > 0 ? matrix[0].length : 0;

    if (rows === 0 || cols === 0) {
        return matrix;
    }

    const newMatrix: Array<Array<number>> = [];

    for (let c = 0; c < cols; ++c) {
        newMatrix.push([]);
        for (let r = 0; r < rows; ++r) {
            newMatrix[c].push(matrix[rows - r - 1][c]);
        }
    }

    return newMatrix;
}

const correctKernelDimensions = (
    control: AbstractControl,
): {emptyKernel?: true; kernelDimensionsNotOdd?: true; kernelDimensionsNegative?: true} | null => {
    const kernelForm = control.value as KernelForm;
    if (!kernelForm) {
        return null;
    }

    let rows: number;
    let cols: number;

    if (kernelForm.type === 'convolution') {
        const convolutionKernelForm = kernelForm as ConvolutionKernelForm;
        rows = convolutionKernelForm.matrix.length;
        cols = rows > 0 ? convolutionKernelForm.matrix[0].length : 0;
    } else if (kernelForm.type === 'standardDeviation') {
        const standardDeviationForm = kernelForm as StandardDeviationForm;
        rows = standardDeviationForm.dimensions[0];
        cols = standardDeviationForm.dimensions[1];

        if (rows < 0 || cols < 0) {
            return {kernelDimensionsNegative: true};
        }
    } else {
        rows = 0;
        cols = 0;
    }

    if (rows === 0 || cols === 0) {
        return {emptyKernel: true};
    }

    if (rows % 2 === 0 || cols % 2 === 0) {
        return {kernelDimensionsNotOdd: true};
    }

    return null;
};
