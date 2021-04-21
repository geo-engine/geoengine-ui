import {map, mergeMap, tap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {RasterDataType, RasterDataTypes} from '../../datatype.model';
import {RasterLayer} from '../../../layers/layer.model';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {OperatorDict, SourceOperatorDict, WorkflowDict} from '../../../backend/backend.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {RasterLayerMetadata} from '../../../layers/layer-metadata.model';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';

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
    readonly RASTER_TYPE = [ResultTypes.RASTER];
    form: FormGroup;

    outputDataTypes$: Observable<Array<[RasterDataType, string]>>;

    /**
     * DI of services and setup of observables for the template
     */
    constructor(private projectService: ProjectService) {
        this.form = new FormGroup(
            {
                rasterLayers: new FormControl(undefined, [Validators.required]),
                expression: new FormControl('1 * A', Validators.compose([Validators.required, Validators.pattern('.*A.*')])),
                dataType: new FormControl(undefined, [Validators.required]),
                // TODO: add unit related inputs
                // minValue: new FormControl(0, Validators.compose([WaveValidators.isNumber])),
                // maxValue: new FormControl(0, Validators.compose([WaveValidators.isNumber])),
                // unit: new FormControl(undefined, [Validators.required]),
                // customUnit: new FormGroup({
                //     measurement: new FormControl(undefined, [Validators.required]),
                //     unit: new FormControl(undefined, [Validators.required]),
                // }),
                // projection: new FormControl(undefined, [Validators.required]),
                name: new FormControl('Expression', [Validators.required, WaveValidators.notOnlyWhitespace]),
                noDataValue: new FormControl(0, Validators.required), // TODO: validate no-data-value is valid for dataType
            },
            // [unitOrCustomUnit]);
        );

        // TODO: add unit related inputs
        // this.outputUnits$ = this.form.controls.rasterLayers.valueChanges.pipe(
        //     map((rasterLayers: Array<RasterLayer<MappingRasterSymbology>>) => {
        //         return rasterLayers
        //             .map(layer => layer.operator.getUnit(ExpressionOperatorComponent.RASTER_VALUE))
        //             .filter(unit => unit !== this.UNITLESS_UNIT);
        //     }),
        //     tap(outputUnits => {
        //         const unitControl = this.form.controls['unit'];
        //         const currentUnit: Unit = unitControl.value;
        //         if (outputUnits.length > 0 && outputUnits.indexOf(currentUnit) === -1) {
        //             setTimeout(() => {
        //                 unitControl.setValue(outputUnits[0]);
        //             });
        //         }
        //
        //         return outputUnits;
        //     }),
        // );

        // this.outputUnitIsCustom$ = this.form.controls.unit.valueChanges.pipe(
        //     map(unit => unit === this.CUSTOM_UNIT_ID),
        //     tap(isCustomUnit => {
        //         if (isCustomUnit) {
        //             this.form.controls.customUnit.enable({onlySelf: true});
        //         } else {
        //             this.form.controls.customUnit.disable({onlySelf: true});
        //         }
        //     }),
        // );
        //
        // this.unitSubscription = this.form.controls.unit.valueChanges.pipe(
        //     filter(unit => unit instanceof Unit)
        // ).subscribe((unit: Unit) => {
        //     if (unit.min) {
        //         this.form.controls.minValue.setValue(unit.min);
        //     }
        //     if (unit.max) {
        //         this.form.controls.maxValue.setValue(unit.max);
        //     }
        // });

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

    /**
     * Uses the user input and creates a new expression operator.
     * The resulting layer is added to the map.
     */
    add(): void {
        const name: string = this.form.controls['name'].value;
        const dataType: RasterDataType = this.form.controls['dataType'].value;
        const expression: string = this.form.controls['expression'].value;
        const rasterLayers = this.form.controls['rasterLayers'].value;
        const noDataValue = this.form.controls['noDataValue'].value;
        // TODO: incoroprate unit related info
        // const projection = this.form.controls['projection'].value;
        // const minValue =  this.form.controls['minValue'].value;
        // const maxValue =  this.form.controls['maxValue'].value;

        // const selectedUnit: Unit | string = this.form.controls['unit'].value;
        // let unit: Unit;
        // if (selectedUnit instanceof Unit) {
        //     unit = new Unit({
        //         measurement: selectedUnit.measurement,
        //         unit: selectedUnit.unit,
        //         interpolation: selectedUnit.interpolation,
        //         classes: selectedUnit.classes,
        //         min: minValue,
        //         max: maxValue,
        //     });
        // } else { // custom unit from strings
        //     unit = new Unit({
        //         measurement: this.form.controls.customUnit.value.measurement,
        //         unit: this.form.controls.customUnit.value.unit,
        //         interpolation: Interpolation.Continuous,
        //         min: minValue,
        //         max: maxValue,
        //     });
        // }

        // console.log(rasterLayers);

        // TODO: add projection operator

        const sourceOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers(rasterLayers);

        sourceOperators
            .pipe(
                map((operators: Array<OperatorDict | SourceOperatorDict>) => {
                    const workflow = {
                        type: 'Raster',
                        operator: {
                            type: 'Expression',
                            params: {
                                expression,
                                output_type: dataType.getCode(),
                                // TODO: make this configurable once units exist again
                                output_no_data_value: noDataValue,
                            },
                            raster_sources: operators,
                            vector_sources: [],
                        },
                    } as WorkflowDict;

                    this.projectService
                        .registerWorkflow(workflow)
                        .pipe(
                            mergeMap((workflowId) =>
                                this.projectService.addLayer(
                                    new RasterLayer({
                                        workflowId,
                                        name,
                                        symbology: RasterSymbology.fromRasterSymbologyDict({
                                            opacity: 1.0,
                                            colorizer: {
                                                LinearGradient: {
                                                    breakpoints: [
                                                        {value: 0, color: [0, 0, 0, 255]},
                                                        {value: 255, color: [255, 255, 255, 255]},
                                                    ],
                                                    default_color: [0, 0, 0, 255],
                                                    no_data_color: [0, 0, 0, 255],
                                                },
                                            },
                                        }),
                                        isLegendVisible: false,
                                        isVisible: true,
                                    }),
                                ),
                            ),
                        )
                        .subscribe(() => {
                            // it worked, do nothing
                        });
                }),
            )
            .subscribe(() => {
                // nothing to do
            });
    }
}

// TODO: validate units once its integrated again
// /**
//  * This is a validator function that checks whether a fields contains either a valid existing unit
//  * or a new (custom) unit.
//  */
// function unitOrCustomUnit(group: FormGroup): ValidationErrors | null {
//     const unit: Unit = group.controls.unit.value;
//     if (unit instanceof Unit) {
//         return null;
//     }
//
//     const customUnit: { measurement: string, unit: string } = group.controls.customUnit.value;
//
//     if (customUnit.measurement && customUnit.unit) {
//         return null;
//     }
//
//     return {
//         unitOrCustomUnit: true,
//     };
// }
