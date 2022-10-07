import {map, mergeMap} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {ProjectService} from '../../../project/project.service';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {NeighborhoodAggregateDict} from '../../../backend/operator.model';
import {LayoutService, SidenavConfig} from '../../../layout.service';
import {geoengineValidators} from '../../../util/form.validators';

interface NeighborhoodAggregateForm {
    rasterLayer: FormControl<RasterLayer | undefined>;
    neighborhood: FormControl<NeighborhoodForm>;
    aggregateFunction: FormControl<'sum' | 'standardDeviation'>;
    name: FormControl<string>;
}

interface NeighborhoodForm {
    type: 'weightsMatrix' | 'rectangle';
}

interface WeightsMatrixNeighborhoodForm extends NeighborhoodForm {
    type: 'weightsMatrix';
    weights: Array<Array<number>>;
}

interface RectangleNeighborhoodForm extends NeighborhoodForm {
    type: 'rectangle';
    dimensions: [number, number];
}

/**
 * The dialog for applying a `NeighborhoodAggregate` operator.
 */
@Component({
    selector: 'geoengine-neighborhood-aggregate',
    templateUrl: './neighborhood-aggregate.component.html',
    styleUrls: ['./neighborhood-aggregate.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeighborhoodAggregateComponent implements AfterViewInit, OnDestroy {
    /**
     * If the inputs are empty, show the following button.
     */
    @Input() dataListConfig?: SidenavConfig;

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly form: FormGroup<NeighborhoodAggregateForm>;

    readonly lastError$ = new BehaviorSubject<string | undefined>(undefined);

    readonly projectHasRasterLayers$: Observable<boolean>;

    readonly subscriptions: Array<Subscription> = [];

    /**
     * DI of services and setup of observables for the template
     */
    constructor(protected readonly projectService: ProjectService, protected readonly layoutService: LayoutService) {
        this.form = new FormGroup<NeighborhoodAggregateForm>({
            rasterLayer: new FormControl<RasterLayer | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            neighborhood: new FormControl<WeightsMatrixNeighborhoodForm | RectangleNeighborhoodForm>(
                {
                    type: 'weightsMatrix',
                    weights: [
                        [1.0, 0.0, -1.0],
                        [2.0, 0.0, -2.0],
                        [1.0, 0.0, -1.0],
                    ],
                },
                {
                    nonNullable: true,
                    validators: [Validators.required, correctNeighborhoodDimensions],
                },
            ),
            aggregateFunction: new FormControl<'sum' | 'standardDeviation'>('sum', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('Neighborhood Aggregate', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
        });

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

    changeNeighborhood(neighborhood: string): void {
        if (neighborhood === 'weightsMatrix') {
            this.form.controls.neighborhood.setValue({
                type: 'weightsMatrix',
                weights: [
                    [1.0, 0.0, -1.0],
                    [2.0, 0.0, -2.0],
                    [1.0, 0.0, -1.0],
                ],
            } as WeightsMatrixNeighborhoodForm);
        } else if (neighborhood === 'rectangle') {
            this.form.controls.neighborhood.setValue({
                type: 'rectangle',
                dimensions: [3, 3],
            } as RectangleNeighborhoodForm);
        }
    }

    getMatrix(): Array<Array<number>> {
        const neighborhood = this.form.controls.neighborhood.value as WeightsMatrixNeighborhoodForm;

        if (neighborhood.type !== 'weightsMatrix') {
            return [];
        }

        return neighborhood.weights;
    }

    setMatrixValue(row: number, col: number, value: number): void {
        const matrix = this.getMatrix();

        if (matrix.length <= row || matrix[0].length <= col) {
            return;
        }

        matrix[row][col] = value;
    }

    enlargeMatrix(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: increaseMatrix(this.getMatrix()),
        } as WeightsMatrixNeighborhoodForm);
    }

    smallenMatrix(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: decreaseMatrix(this.getMatrix()),
        } as WeightsMatrixNeighborhoodForm);
    }

    rotate90(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: rotateMatrixClockwise(this.getMatrix()),
        } as WeightsMatrixNeighborhoodForm);
    }

    presetDerivativeForSobel(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: [
                [1.0, 0.0, -1.0],
                [2.0, 0.0, -2.0],
                [1.0, 0.0, -1.0],
            ],
        } as WeightsMatrixNeighborhoodForm);
    }

    presetMean(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: [
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
                [1 / 9, 1 / 9, 1 / 9],
            ],
        } as WeightsMatrixNeighborhoodForm);
    }

    presetGaussianBlur(): void {
        this.form.controls.neighborhood.setValue({
            type: 'weightsMatrix',
            weights: [
                [0.003, 0.0133, 0.0219, 0.0133, 0.003],
                [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
                [0.0219, 0.0983, 0.1621, 0.0983, 0.0219],
                [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
                [0.003, 0.0133, 0.0219, 0.0133, 0.003],
            ],
        } as WeightsMatrixNeighborhoodForm);
    }

    setDimensionValue(dimension: number, value: number): void {
        const dimensions = this.getDimensions();
        dimensions[dimension] = value;

        this.form.controls.neighborhood.setValue({
            type: 'rectangle',
            dimensions,
        } as RectangleNeighborhoodForm);
    }

    getDimensions(): [number, number] {
        const neighborhood = this.form.controls.neighborhood.value as RectangleNeighborhoodForm;

        if (neighborhood.type !== 'rectangle') {
            return [0, 0];
        }

        return neighborhood.dimensions;
    }

    /**
     * Uses the user input and creates a new expression operator.
     * The resulting layer is added to the map.
     */
    add(): void {
        const name: string = this.form.controls['name'].value;
        const rasterLayer: RasterLayer | undefined = this.form.controls['rasterLayer'].value;
        const neighborhood: NeighborhoodForm = this.form.controls.neighborhood.value;
        const aggregateFunction: 'sum' | 'standardDeviation' = this.form.controls.aggregateFunction.value;

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
                            type: 'NeighborhoodAggregate',
                            params: {
                                neighborhood,
                                aggregateFunction,
                            },
                            sources: {
                                raster,
                            },
                        } as NeighborhoodAggregateDict,
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

const correctNeighborhoodDimensions = (
    control: AbstractControl,
): {emptyDimensions?: true; dimensionsNotOdd?: true; dimensionsNegative?: true} | null => {
    const neighborhoodForm = control.value as NeighborhoodForm;
    if (!neighborhoodForm) {
        return null;
    }

    let rows: number;
    let cols: number;

    if (neighborhoodForm.type === 'weightsMatrix') {
        const weightsMatrixNeighborhoodForm = neighborhoodForm as WeightsMatrixNeighborhoodForm;
        rows = weightsMatrixNeighborhoodForm.weights.length;
        cols = rows > 0 ? weightsMatrixNeighborhoodForm.weights[0].length : 0;
    } else if (neighborhoodForm.type === 'rectangle') {
        const rectangleNeighborhoodForm = neighborhoodForm as RectangleNeighborhoodForm;
        rows = rectangleNeighborhoodForm.dimensions[0];
        cols = rectangleNeighborhoodForm.dimensions[1];

        if (rows === null || cols === null) {
            return {emptyDimensions: true};
        }

        if (rows < 0 || cols < 0) {
            return {dimensionsNegative: true};
        }
    } else {
        rows = 0;
        cols = 0;
    }

    if (rows === 0 || cols === 0) {
        return {emptyDimensions: true};
    }

    if (rows % 2 === 0 || cols % 2 === 0) {
        return {dimensionsNotOdd: true};
    }

    return null;
};
