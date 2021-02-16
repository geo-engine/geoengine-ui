import {map, mergeMap} from 'rxjs/operators';
import {Observable, Subscription, zip} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {Unit} from '../../unit.model';
// import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingRasterSymbology} from '../../../layers/symbology/symbology.model';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';

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
    private static readonly RASTER_VALUE = 'value';
    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly UNITLESS_UNIT = Unit.defaultUnit;
    readonly CUSTOM_UNIT_ID = 'CUSTOM';

    form: FormGroup;

    outputDataTypes$: Observable<Array<[DataType, string]>>;
    // TODO: reincorporate unit
    // outputUnits$: Observable<Array<Unit>>;
    // outputUnitIsCustom$: Observable<boolean>;

    unitSubscription: Subscription;

    /**
     * DI of services and setup of observables for the template
     */
    constructor(private projectService: ProjectService) {
        this.form = new FormGroup({
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

        // TODO: use layer data types for data type selection
        this.outputDataTypes$ = this.form.controls.rasterLayers.valueChanges.pipe(
            map((rasterLayers: Array<RasterLayer>) => {
                const outputDataTypes = DataTypes.ALL_DATATYPES.map((dataType: DataType) => [dataType, '']) as Array<[DataType, string]>;

                // const rasterDataTypes = rasterLayers.map(layer =>
                //     layer ? layer.operator.getDataType(ExpressionOperatorComponent.RASTER_VALUE) : undefined);

                // for (let i = 0; i < outputDataTypes.length; i++) {
                //     const outputDataType = outputDataTypes[i][0];
                //
                //     const indices = rasterDataTypes
                //         .map((dataType, index) => dataType === outputDataType ? index : -1)
                //         .filter(index => index >= 0)
                //         .map(index => LetterNumberConverter.toLetters(index + 1));
                //
                //     if (indices.length > 0) {
                //         outputDataTypes[i][1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
                //     }
                // }

                return outputDataTypes;
            })
            // ,
            // tap(outputDataTypes => {
            //     const dataTypeControl = this.form.controls.dataType;
            //     const currentDataType: DataType = dataTypeControl.value;
            //
            //     const rasterDataTypes = (this.form.controls.rasterLayers.value as Array<RasterLayer>)
            //         .map(layer => layer ? layer.operator.getDataType(ExpressionOperatorComponent.RASTER_VALUE) : undefined)
            //         .filter(layer => !!layer);
            //
            //     if (rasterDataTypes.includes(currentDataType)) { // is already set at a meaningful type
            //         return;
            //     }
            //
            //     let selectedDataType: DataType = currentDataType ? currentDataType : outputDataTypes[0][0]; // use default
            //     if (rasterDataTypes.length) {
            //         selectedDataType = rasterDataTypes[0];
            //     }
            //
            //     setTimeout(() => {
            //         dataTypeControl.setValue(selectedDataType);
            //     });
            // }),
        );

    }

    ngAfterViewInit() {
        setTimeout(() => this.form.controls['rasterLayers'].updateValueAndValidity({
            onlySelf: false,
            emitEvent: true,
        }));
    }

    ngOnDestroy() {
        // TODO: incorporate unit again
        // this.unitSubscription.unsubscribe();
    }

    /**
     * Uses the user input and creates a new expression operator.
     * The resulting layer is added to the map.
     */
    add() {
        const name: string = this.form.controls['name'].value;
        const dataType: DataType = this.form.controls['dataType'].value;
        const expression: string = this.form.controls['expression'].value;
        const rasterLayers = this.form.controls['rasterLayers'].value;
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
        const unit = Unit.defaultUnit;

        // TODO: add projection operator
        zip(
            this.projectService.getWorkflow(rasterLayers[0].workflowId),
            this.projectService.getWorkflow(rasterLayers[1].workflowId)
        ).pipe(map(([a, b]) => {
            const workflow = {
                type: 'Raster',
                operator: {
                    type: 'Expression',
                    params: {
                        expression,
                        output_type: dataType.getCode(),
                        output_no_data_value: dataType.noData(dataType.getMax()),  // TODO: make this configurable once units exist again
                    },
                    raster_sources: [
                        a.operator,
                        b.operator
                    ],
                    vector_sources: []
                }
            };

            this.projectService.registerWorkflow(workflow).pipe(
                mergeMap(workflowId => {
                    return this.projectService.addLayer(new RasterLayer({
                        workflowId,
                        name,
                        symbology: new MappingRasterSymbology({
                            opacity: 1,
                            // TODO: insert proper unit
                            unit: new Unit({
                                measurement: Unit.defaultUnit.measurement,
                                unit: Unit.defaultUnit.unit,
                                min: 1,
                                max: 255,
                                interpolation: Unit.defaultUnit.interpolation,
                            })
                        }),
                        isLegendVisible: false,
                        isVisible: true,
                    }));
                })
            ).subscribe(() => console.log('added raster'));
        })).subscribe(console.log);
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
