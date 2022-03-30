import {map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {RasterDataType, RasterDataTypes} from '../../datatype.model';
import {Layer, RasterLayer} from '../../../layers/layer.model';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {OperatorDict, SourceOperatorDict, UUID, WorkflowDict} from '../../../backend/backend.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {RasterLayerMetadata} from '../../../layers/layer-metadata.model';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {ExpressionDict} from '../../../backend/operator.model';
import {LayoutService} from '../../../layout.service';
import {DatasetListComponent} from '../../../datasets/dataset-list/dataset-list.component';

/**
 * This dialog allows calculations on (one or more) raster layers.
 */
@Component({
    selector: 'wave-expression-operator',
    templateUrl: './expression-operator.component.html',
    styleUrls: ['./expression-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpressionOperatorComponent implements AfterViewInit, OnDestroy {
    /**
     * If the list is empty, show the following button.
     */
    @Input() dataListConfig = {component: DatasetListComponent};

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly form: FormGroup;

    readonly outputDataTypes$: Observable<Array<[RasterDataType, string]>>;

    readonly rasterVariables$: Observable<Array<string>>;

    readonly fnSignature: Observable<string>;

    readonly lastError$ = new BehaviorSubject<string | undefined>(undefined);

    readonly projectHasRasterLayers$: Observable<boolean>;

    /**
     * DI of services and setup of observables for the template
     */
    constructor(protected readonly projectService: ProjectService, protected readonly layoutService: LayoutService) {
        this.form = new FormGroup({
            rasterLayers: new FormControl(undefined, [Validators.required]),
            expression: new FormControl('    1 * A', Validators.compose([Validators.required])),
            dataType: new FormControl(undefined, [Validators.required]),
            name: new FormControl('Expression', [Validators.required, WaveValidators.notOnlyWhitespace]),
            noDataValue: new FormControl('0', this.validateNoData),
            mapNoData: new FormControl(false, Validators.required),
            // TODO: add unit related inputs
        });

        this.outputDataTypes$ = this.form.controls.rasterLayers.valueChanges.pipe(
            mergeMap((rasterLayers: Array<RasterLayer>) => {
                const metaData = rasterLayers.map((l) => this.projectService.getRasterLayerMetadata(l));
                return combineLatest(metaData);
            }),
            map((rasterLayers: Array<RasterLayerMetadata>) => {
                const outputDataTypes: Array<[RasterDataType, string]> = RasterDataTypes.ALL_DATATYPES.map((dataType: RasterDataType) => [
                    dataType,
                    '',
                ]);

                for (const output of outputDataTypes) {
                    const outputDataType = output[0];

                    const indices = rasterLayers
                        .map((layer, index) => (layer.dataType === outputDataType ? index : -1))
                        .filter((index) => index >= 0)
                        .map((index) => LetterNumberConverter.toLetters(index + 1));

                    if (indices.length > 0) {
                        output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
                    }
                }
                return [rasterLayers, outputDataTypes] as [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>];
            }),
            tap(([rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => {
                const dataTypeControl = this.form.controls.dataType;
                const currentDataType: RasterDataType = dataTypeControl.value;
                const rasterDataTypes = rasterLayers.map((layer) => layer.dataType);
                if (rasterDataTypes.includes(currentDataType)) {
                    // is already set at a meaningful type
                    return;
                }
                let selectedDataType: RasterDataType = currentDataType ? currentDataType : outputDataTypes[0][0]; // use default
                if (rasterDataTypes.length) {
                    selectedDataType = rasterDataTypes[0];
                }
                setTimeout(() => {
                    dataTypeControl.setValue(selectedDataType);
                });
            }),
            map(([_rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => outputDataTypes),
        );

        this.rasterVariables$ = this.form.controls.rasterLayers.valueChanges.pipe(
            map((rasterLayers: Array<RasterLayer>) => rasterLayers.map((_, index) => LetterNumberConverter.toLetters(index + 1))),
        );

        this.fnSignature = this.rasterVariables$.pipe(map((vars: string[]) => `fn(${vars.join(', ')}, out_nodata) {`));

        this.projectHasRasterLayers$ = this.projectService
            .getLayerStream()
            .pipe(map((layers: Array<Layer>) => layers.filter((layer) => layer.layerType === 'raster').length > 0));
    }

    ngAfterViewInit(): void {
        setTimeout(() =>
            this.form.controls['rasterLayers'].updateValueAndValidity({
                onlySelf: false,
                emitEvent: true,
            }),
        );
    }

    ngOnDestroy(): void {
        // TODO: incorporate unit again
        // this.unitSubscription.unsubscribe();
    }

    validateNoData(control: AbstractControl): ValidationErrors | null {
        if (!isNaN(parseFloat(control.value)) || control.value.toLowerCase() === 'nan') {
            return null;
        } else {
            return {
                error: true,
            };
        }
    }

    validateNoDataType(control: AbstractControl): ValidationErrors | null {
        let valid = true;
        const dataType = control.get('dataType')?.value;
        const value = control.get('noDataValue')?.value;
        const floatValue = parseFloat(value);

        if (dataType == null || floatValue == null) {
            return {
                error: true,
            };
        }

        if (!isNaN(floatValue)) {
            valid = dataType.getMin() <= floatValue && floatValue <= dataType.getMax();
        } else {
            valid = value.toLowerCase() === 'nan' && (dataType === RasterDataTypes.Float32 || dataType === RasterDataTypes.Float64);
        }

        if (valid) {
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
        const name: string = this.form.controls['name'].value;
        const dataType: RasterDataType = this.form.controls['dataType'].value;
        const expression: string = this.form.controls['expression'].value;
        const rasterLayers: Array<RasterLayer> = this.form.controls['rasterLayers'].value;
        const noDataValueString: string = this.form.controls['noDataValue'].value;
        const mapNoData: boolean = this.form.controls['mapNoData'].value;

        let outputNoDataValue: number | 'nan';
        if (isNaN(parseFloat(noDataValueString))) {
            outputNoDataValue = 'nan';
        } else {
            outputNoDataValue = parseFloat(noDataValueString);
        }

        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers(rasterLayers);

        sourceOperators
            .pipe(
                mergeMap((operators: Array<OperatorDict | SourceOperatorDict>) => {
                    const workflow: WorkflowDict = {
                        type: 'Raster',
                        operator: {
                            type: 'Expression',
                            params: {
                                expression,
                                outputType: dataType.getCode(),
                                outputNoDataValue,
                                // TODO: make this configurable once units exist again
                                // outputMeasurement: undefined,
                                mapNoData,
                            },
                            sources: {
                                a: operators[0],
                                b: operators.length >= 2 ? operators[1] : undefined,
                                c: operators.length >= 3 ? operators[2] : undefined,
                                d: operators.length >= 4 ? operators[3] : undefined,
                                e: operators.length >= 5 ? operators[4] : undefined,
                                f: operators.length >= 6 ? operators[5] : undefined,
                                g: operators.length >= 7 ? operators[6] : undefined,
                                h: operators.length >= 8 ? operators[7] : undefined,
                            },
                        } as ExpressionDict,
                    };

                    return this.projectService.registerWorkflow(workflow);
                }),
                mergeMap((workflowId: UUID) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                type: 'raster',
                                opacity: 1.0,
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
            .subscribe(
                () => {
                    // everything worked well

                    this.lastError$.next(undefined);
                },
                (error) => {
                    const errorMsg = error.error.message;

                    this.lastError$.next(errorMsg);
                },
            );
    }

    goToAddDataTab(): void {
        this.layoutService.setSidenavContentComponent(this.dataListConfig);
    }
}
