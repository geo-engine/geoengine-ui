import {filter, map, tap} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {Interpolation, Unit} from '../../unit.model';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {Operator} from '../../operator.model';
import {ExpressionType} from '../../types/expression-type.model';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';


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
    outputUnits$: Observable<Array<Unit>>;
    outputUnitIsCustom$: Observable<boolean>;

    unitSubscription: Subscription;

    constructor(private projectService: ProjectService) {
        this.form = new FormGroup({
                rasterLayers: new FormControl(undefined, [Validators.required]),
                expression: new FormControl('1 * A', Validators.compose([Validators.required, Validators.pattern('.*A.*')])),
                dataType: new FormControl(undefined, [Validators.required]),
                minValue: new FormControl(0, Validators.compose([WaveValidators.isNumber])),
                maxValue: new FormControl(0, Validators.compose([WaveValidators.isNumber])),
                unit: new FormControl(undefined, [Validators.required]),
                customUnit: new FormGroup({
                    measurement: new FormControl(undefined, [Validators.required]),
                    unit: new FormControl(undefined, [Validators.required]),
                }),
                projection: new FormControl(undefined, [Validators.required]),
                name: new FormControl('Expression', [Validators.required, WaveValidators.notOnlyWhitespace]),
            },
            [unitOrCustomUnit]);

        this.outputUnits$ = this.form.controls.rasterLayers.valueChanges.pipe(
            map((rasterLayers: Array<RasterLayer<MappingColorizerRasterSymbology>>) => {
                return rasterLayers
                    .map(layer => layer.operator.getUnit(ExpressionOperatorComponent.RASTER_VALUE))
                    .filter(unit => unit !== this.UNITLESS_UNIT);
            }),
            tap(outputUnits => {
                const unitControl = this.form.controls['unit'];
                const currentUnit: Unit = unitControl.value;
                if (outputUnits.length > 0 && outputUnits.indexOf(currentUnit) === -1) {
                    setTimeout(() => {
                        unitControl.setValue(outputUnits[0]);
                    });
                }

                return outputUnits;
            }),
        );

        this.outputUnitIsCustom$ = this.form.controls.unit.valueChanges.pipe(
            map(unit => unit === this.CUSTOM_UNIT_ID),
            tap(isCustomUnit => {
                if (isCustomUnit) {
                    this.form.controls.customUnit.enable({onlySelf: true});
                } else {
                    this.form.controls.customUnit.disable({onlySelf: true});
                }
            }),
        );

        this.unitSubscription = this.form.controls.unit.valueChanges.pipe(
            filter(unit => unit instanceof Unit)
        ).subscribe((unit: Unit) => {
            if (unit.min) {
                this.form.controls.minValue.setValue(unit.min);
            }
            if (unit.max) {
                this.form.controls.maxValue.setValue(unit.max);
            }
        });

        this.outputDataTypes$ = this.form.controls.rasterLayers.valueChanges.pipe(
            map((rasterLayers: Array<RasterLayer<MappingColorizerRasterSymbology>>) => {
                const outputDataTypes = DataTypes.ALL_NUMERICS.map((dataType: DataType) => [dataType, '']) as Array<[DataType, string]>;

                const rasterDataTypes = rasterLayers.map(layer =>
                    layer ? layer.operator.getDataType(ExpressionOperatorComponent.RASTER_VALUE) : undefined);

                for (let i = 0; i < outputDataTypes.length; i++) {
                    const outputDataType = outputDataTypes[i][0];

                    const indices = rasterDataTypes
                        .map((dataType, index) => dataType === outputDataType ? index : -1)
                        .filter(index => index >= 0)
                        .map(index => LetterNumberConverter.toLetters(index + 1));

                    if (indices.length > 0) {
                        outputDataTypes[i][1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
                    }
                }

                return outputDataTypes;
            }),
            tap(outputDataTypes => {
                const dataTypeControl = this.form.controls.dataType;
                const currentDataType: DataType = dataTypeControl.value;

                const rasterDataTypes = (this.form.controls.rasterLayers.value as Array<RasterLayer<MappingColorizerRasterSymbology>>)
                    .map(layer => layer ? layer.operator.getDataType(ExpressionOperatorComponent.RASTER_VALUE) : undefined)
                    .filter(layer => !!layer);

                if (rasterDataTypes.includes(currentDataType)) { // is already set at a meaningful type
                    return;
                }

                let selectedDataType: DataType = currentDataType ? currentDataType : outputDataTypes[0][0]; // use default
                if (rasterDataTypes.length) {
                    selectedDataType = rasterDataTypes[0];
                }

                setTimeout(() => {
                    dataTypeControl.setValue(selectedDataType);
                });
            }),
        );

    }

    ngAfterViewInit() {
        setTimeout(() => this.form.controls['rasterLayers'].updateValueAndValidity({
            onlySelf: false,
            emitEvent: true,
        }));
    }

    ngOnDestroy() {
        this.unitSubscription.unsubscribe();
    }

    add() {
        const name: string = this.form.controls['name'].value;
        const dataType: DataType = this.form.controls['dataType'].value;
        const expression: string = this.form.controls['expression'].value;
        const rasterLayers = this.form.controls['rasterLayers'].value;
        const projection = this.form.controls['projection'].value;
        const minValue = this.form.controls['minValue'].value;
        const maxValue = this.form.controls['maxValue'].value;

        const selectedUnit: Unit | string = this.form.controls['unit'].value;
        let unit: Unit;
        if (selectedUnit instanceof Unit) {
            unit = new Unit({
                measurement: selectedUnit.measurement,
                unit: selectedUnit.unit,
                interpolation: selectedUnit.interpolation,
                classes: selectedUnit.classes,
                min: minValue,
                max: maxValue,
            });
        } else { // custom unit from strings
            unit = new Unit({
                measurement: this.form.controls.customUnit.value.measurement,
                unit: this.form.controls.customUnit.value.unit,
                interpolation: Interpolation.Continuous,
                min: minValue,
                max: maxValue,
            });
        }

        const operator = new Operator({
            operatorType: new ExpressionType({
                expression: expression,
                datatype: dataType,
                unit: unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: projection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', dataType),
            units: new Map<string, Unit>().set('value', unit),
            rasterSources: rasterLayers.map(l => l.operator.getProjectedOperator(projection)),
        });

        const layer = new RasterLayer({
            name: name,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({unit: unit}),
        });
        this.projectService.addLayer(layer);

    }

}


function unitOrCustomUnit(group: FormGroup): ValidationErrors | null {
    const unit: Unit = group.controls.unit.value;
    if (unit instanceof Unit) {
        return null;
    }

    const customUnit: { measurement: string, unit: string } = group.controls.customUnit.value;

    if (customUnit.measurement && customUnit.unit) {
        return null;
    }

    return {
        unitOrCustomUnit: true,
    };
}
