import {map, mergeMap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {UUID} from '../../../backend/backend.model';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {LayoutService, SidenavConfig} from '../../../layout.service';
import {
    ExpressionDict,
    GeoEngineError,
    Layer,
    MeasurementComponent,
    RasterDataType,
    RasterDataTypes,
    RasterLayer,
    RasterLayerMetadata,
    RasterSymbology,
    ResultTypes,
    SingleBandRasterColorizer,
    geoengineValidators,
} from '@geoengine/common';
import {SymbologyCreationType, SymbologyCreatorComponent} from '../../../layers/symbology/symbology-creator/symbology-creator.component';
import {Measurement, Workflow as WorkflowDict} from '@geoengine/openapi-client';

interface ExpressionForm {
    rasterLayer: FormControl<RasterLayer | undefined>;
    expression: FormControl<string>;
    dataType: FormControl<RasterDataType | undefined>;
    name: FormControl<string>;
    mapNoData: FormControl<boolean>;
    outputBandName: FormControl<string>;
    outputMeasurement: FormControl<Measurement | undefined>;
    symbologyCreation: FormControl<SymbologyCreationType>;
}

/**
 * This dialog allows calculations on (one or more) raster layers.
 */
@Component({
    selector: 'geoengine-expression-operator',
    templateUrl: './expression-operator.component.html',
    styleUrls: ['./expression-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ExpressionOperatorComponent implements AfterViewInit {
    /**
     * If the list is empty, show the following button.
     */
    @Input() dataListConfig?: SidenavConfig;

    @ViewChild(MeasurementComponent) measurementComponent?: MeasurementComponent;

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly form: FormGroup<ExpressionForm>;

    readonly outputDataTypes$: Observable<Array<[RasterDataType, string]>>;

    readonly rasterVariables$: Observable<Array<string>>;

    readonly fnSignature: Observable<string>;

    readonly lastError$ = new BehaviorSubject<string | undefined>(undefined);
    readonly projectHasRasterLayers$: Observable<boolean>;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    @ViewChild(SymbologyCreatorComponent)
    readonly symbologyCreator!: SymbologyCreatorComponent;

    /**
     * DI of services and setup of observables for the template
     */
    constructor(
        protected readonly projectService: ProjectService,
        protected readonly layoutService: LayoutService,
    ) {
        this.form = new FormGroup<ExpressionForm>({
            rasterLayer: new FormControl<RasterLayer | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            expression: new FormControl<string>('    1 * A', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            mapNoData: new FormControl(false, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('Expression', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            outputBandName: new FormControl('band', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            outputMeasurement: new FormControl<Measurement | undefined>(undefined, {
                nonNullable: true,
            }),
            symbologyCreation: new FormControl(SymbologyCreationType.AS_INPUT, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            // TODO: add unit related inputs
        });

        // TODO on selected raster update the data type (like input)
        this.outputDataTypes$ = this.form.controls.rasterLayer.valueChanges.pipe(
            mergeMap((rasterLayer: RasterLayer | undefined) => {
                if (!rasterLayer) {
                    return of(undefined);
                }

                return this.projectService.getRasterLayerMetadata(rasterLayer);
            }),
            map((rasterLayer: RasterLayerMetadata | undefined) => {
                const outputDataTypes: Array<[RasterDataType, string]> = RasterDataTypes.ALL_DATATYPES.map((dataType: RasterDataType) => [
                    dataType,
                    '',
                ]);

                if (!rasterLayer) {
                    return outputDataTypes;
                }

                for (const output of outputDataTypes) {
                    const outputDataType = output[0];

                    if (outputDataType === rasterLayer?.dataType) {
                        output[1] = '(like input)';

                        const dataTypeControl = this.form.controls.dataType;
                        setTimeout(() => {
                            dataTypeControl.setValue(outputDataType);
                        });
                    }
                }

                return outputDataTypes;
            }),
        );

        this.rasterVariables$ = this.form.controls.rasterLayer.valueChanges.pipe(
            mergeMap((rasterLayer: RasterLayer | undefined) => {
                if (!rasterLayer) {
                    return of([]);
                }

                return this.projectService
                    .getRasterLayerMetadata(rasterLayer)
                    .pipe(map((meta) => meta.bands.map((_, index) => LetterNumberConverter.toLetters(index + 1))));
            }),
        );

        this.fnSignature = this.rasterVariables$.pipe(map((vars: string[]) => `fn(${vars.join(', ')}) {`));

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

    /*
    ngOnDestroy(): void {
        // TODO: incorporate unit again
        // this.unitSubscription.unsubscribe();
    }
    */

    validateNoData(control: AbstractControl): ValidationErrors | null {
        if (!isNaN(parseFloat(control.value)) || control.value.toLowerCase() === 'nan') {
            return null;
        } else {
            return {
                error: true,
            };
        }
    }

    /**
     * Uses the user input and creates a new expression operator.
     * The resulting layer is added to the map.
     */
    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }
        const name: string = this.form.controls['name'].value;
        const dataType: RasterDataType | undefined = this.form.controls['dataType'].value;
        const expression: string = this.form.controls['expression'].value;
        const rasterLayer: RasterLayer | undefined = this.form.controls['rasterLayer'].value;
        const mapNoData: boolean = this.form.controls['mapNoData'].value;
        const outputBandName: string = this.form.controls['outputBandName'].value;

        let outputMeasurement: Measurement | undefined = undefined;

        if (this.measurementComponent?.measurement) {
            outputMeasurement = this.measurementComponent.measurement;
        }

        const outputBand = {
            name: outputBandName,
            measurement: outputMeasurement,
        };

        if (!dataType || !rasterLayer) {
            return; // checked by form validator
        }

        this.projectService
            .getWorkflow(rasterLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow) => {
                    const workflow: WorkflowDict = {
                        type: 'Raster',
                        operator: {
                            type: 'Expression',
                            params: {
                                expression,
                                outputType: dataType.getCode(),
                                outputBand,
                                mapNoData,
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as ExpressionDict,
                    } as WorkflowDict;

                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId: UUID) => {
                    const symbology$: Observable<RasterSymbology> = this.symbologyCreator.symbologyForRasterLayer(workflowId, rasterLayer);
                    return combineLatest([of(workflowId), symbology$]);
                }),
                mergeMap(([workflowId, symbology]: [UUID, RasterSymbology]) => {
                    if (symbology.rasterColorizer instanceof SingleBandRasterColorizer) {
                        const outSymbology = new RasterSymbology(symbology.opacity, symbology.rasterColorizer.replaceBand(0));
                        return this.projectService.addLayer(
                            new RasterLayer({
                                workflowId,
                                name,
                                symbology: outSymbology,
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    } else {
                        throw new GeoEngineError('SymbologyError', 'The input Symbology must be a single band colorizer.');
                    }
                }),
            )
            .subscribe({
                next: () => {
                    // everything worked well
                    this.lastError$.next(undefined);
                    this.loading$.next(false);
                },
                error: (error) => {
                    const errorMsg = error.error.message;
                    this.lastError$.next(errorMsg);
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
}
