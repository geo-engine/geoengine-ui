import {Component, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {LayerService} from '../../../../layers/layer.service';
import {DataTypes, DataType} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {Observable} from 'rxjs/Rx';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {Operator} from '../../operator.model';
import {ExpressionType} from '../../types/expression-type.model';
import {RasterLayer} from '../../../../layers/layer.model';
import {RasterSymbology} from '../../../../symbology/symbology.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';

@Component({
    selector: 'wave-expression-operator',
    templateUrl: './expression-operator.component.html',
    styleUrls: ['./expression-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpressionOperatorComponent implements AfterViewInit {
    // make accessible
    ResultTypes = ResultTypes;
    //

    form: FormGroup;

    outputDataTypes$: Observable<Array<[DataType, string]>>;
    outputUnits$: Observable<Array<Unit>>;

    constructor(private layerService: LayerService,
                private mappingQueryService: MappingQueryService,
                private formBuilder: FormBuilder,
                private changeDetectorRef: ChangeDetectorRef) {
        this.form = formBuilder.group({
            rasterLayers: [undefined, Validators.required],
            expression: ['1 * A', Validators.compose([
                Validators.required,
                Validators.pattern('.*A.*'),
            ])],
            dataType: [undefined, Validators.required],
            minValue: [0, Validators.compose([
                Validators.required,
            ])],
            maxValue: [0, Validators.compose([
                Validators.required,
            ])],
            unit: [undefined, Validators.required],
            projection: [
                /*firstRasterLayer ? firstRasterLayer.operator.projection : */undefined,
                Validators.required,
            ],
            name: ['Expression', Validators.required],
        });

        this.outputUnits$ = this.form.controls['rasterLayers'].valueChanges.map(rasterLayers => {
            const outputUnits: Array<Unit> = [];
            for (const layer of rasterLayers) {
                const unit = layer.operator.getUnit('value');
                if (outputUnits.indexOf(unit) === -1) {
                    outputUnits.push(unit);
                }
            }

            if (outputUnits.indexOf(Unit.defaultUnit) === -1) {
                outputUnits.push(Unit.defaultUnit);
            }

            const unitControl = this.form.controls['unit'];
            const currentUnit: Unit = unitControl.value;
            if (outputUnits.length > 0 && outputUnits.indexOf(currentUnit) === -1) {
                setTimeout(() => {
                    unitControl.setValue(outputUnits[0]);
                    this.changeDetectorRef.markForCheck();
                }, 0);
            }

            return outputUnits;
        });

        this.outputDataTypes$ = this.form.controls['rasterLayers'].valueChanges.map(rasterLayers => {
            let outputDataTypes = DataTypes.ALL_NUMERICS.map(
                (datatype: DataType) => [datatype, '']
            ) as Array<[DataType, string]>;

            let firstItemWithRefs: [DataType, string] = undefined;
            for (let i = 0; i < outputDataTypes.length; i++) {
                const dataType = outputDataTypes[i][0];
                const refs: Array<string> = [];
                for (let l = 0; l < rasterLayers.length; l++) {
                    if (dataType === rasterLayers[l].operator.getDataType('value')) {
                        refs.push(LetterNumberConverter.toLetters(l + 1));
                    }
                    if (refs.length > 0) {
                        outputDataTypes[i][1] =
                            `(like ${refs.length > 1 ? 'layers' : 'layer'} ${refs.join(',')})`;
                        if (firstItemWithRefs === undefined) {
                            firstItemWithRefs = outputDataTypes[i];
                        }
                    } else {
                        outputDataTypes[i][1] = '';
                    }
                }
            }

            const dataTypeControl = this.form.controls['dataType'];
            if (!dataTypeControl.value) {
                setTimeout(() => {
                    dataTypeControl.setValue(firstItemWithRefs);
                    const minValueControl = this.form.controls['minValue'];
                    const maxValueControl = this.form.controls['maxValue'];
                    minValueControl.setValue(firstItemWithRefs[0].getMin());
                    maxValueControl.setValue(firstItemWithRefs[0].getMax() - 1);

                    this.changeDetectorRef.markForCheck();
                }, 0);
            }

            return outputDataTypes;
        });

    }

    ngAfterViewInit() {
        setTimeout(() => this.form.controls['rasterLayers'].updateValueAndValidity({
            onlySelf: false,
            emitEvent: true
        }), 0);
    }

    add() {
        const name: string = this.form.controls['name'].value;
        const dataType: DataType = this.form.controls['dataType'].value[0];
        const expression: string = this.form.controls['expression'].value;
        const rasterLayers = this.form.controls['rasterLayers'].value;
        const projection = this.form.controls['projection'].value;
        const minValue = this.form.controls['minValue'].value;
        const maxValue = this.form.controls['maxValue'].value;

        const selectedUnit: Unit = this.form.controls['unit'].value;
        const unit = new Unit({
            measurement: selectedUnit.measurement,
            unit: selectedUnit.unit,
            interpolation: selectedUnit.interpolation,
            classes: selectedUnit.classes,
            min: minValue,
            max: maxValue,
        });

        const operator = new Operator({
            operatorType: new ExpressionType({
                expression: expression,
                datatype: dataType,
                unit: unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: projection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>()
                .set('value', dataType),
            units: new Map<string, Unit>()
                .set('value', unit),
            rasterSources: rasterLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            ),
        });

        this.layerService.addLayer(new RasterLayer({
            name: name,
            operator: operator,
            symbology: new RasterSymbology({ unit: unit }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        }));

    }

}
