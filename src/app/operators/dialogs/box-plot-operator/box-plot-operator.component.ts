import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Symbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {DataType, DataTypes} from '../../datatype.model';
import {NumericPipe} from '../scatter-plot-operator/scatter-plot-operator.pipe';
import {WaveValidators} from '../../../util/form.validators';
import {BoxPlotType} from '../../types/boxplot-type.model';

@Component({
    selector: 'wave-box-plot-operator',
    templateUrl: './box-plot-operator.component.html',
    styleUrls: ['./box-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxPlotComponent implements OnInit, AfterViewInit {

    form: FormGroup;

    pointLayers: Array<Layer<Symbology>>;

    ResultTypes = ResultTypes;
    NumericPipe = NumericPipe;
    DataTypes = DataTypes;

    max = 5;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            vLayer: [undefined, Validators.required],
            attributes: [[], [Validators.required, Validators.minLength(1)]],
            notch: [false, Validators.required],
            mean: [false, Validators.required],
            range: [1.5, [Validators.required, this.nonNegative]],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    increase() {
        const inputOperator = this.form.controls['vLayer'].value.operator as Operator;

        const [numericAttribute] = inputOperator.dataTypes.findEntry((value) => {
            return this.DataTypes.ALL_NUMERICS.indexOf(value) >= 0;
        }) as [string, DataType];
        // TODO: propose unused attribute

        if (numericAttribute) {
            this.form.controls['attributes'].value.push(numericAttribute);
            this.form.controls['attributes'].updateValueAndValidity();
        } else {
            this.form.controls['vLayer'].setErrors({'noNumericalAttributes': true});
        }
    }

    decrease() {
        this.form.controls['attributes'].value.pop();
        this.form.controls['attributes'].updateValueAndValidity();
        // console.log(this.attributes, this.attributes.getValue());
    }

    add() {
        const sourceOperator = this.form.controls['vLayer'].value.operator;

        const operator: Operator = new Operator({
            operatorType: new BoxPlotType({
                notch: this.form.controls['notch'].value,
                mean: this.form.controls['mean'].value,
                range: this.form.controls['range'].value,
                attributes: this.form.controls['attributes'].value,
                inputType: sourceOperator.resultType,
            }),
            resultType: ResultTypes.PLOT,
            projection: sourceOperator.projection,
            pointSources: sourceOperator.resultType === ResultTypes.POINTS ? [sourceOperator] : undefined,
            lineSources: sourceOperator.resultType === ResultTypes.LINES ? [sourceOperator] : undefined,
            polygonSources: sourceOperator.resultType === ResultTypes.POLYGONS ? [sourceOperator] : undefined,
        });
        const plot = new Plot({
            name: this.form.controls['name'].value,
            operator: operator,
        });
        this.projectService.addPlot(plot);
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.form.updateValueAndValidity({
                onlySelf: false,
                emitEvent: true
            });
            this.form.controls['vLayer'].updateValueAndValidity();

            const nameSuggestion = ' of ' + (this.form.controls['vLayer'].value ? this.form.controls['vLayer'].value.name : '');
            this.form.controls['name'].setValue('Box plot' + nameSuggestion);
        });
    }

    updateAttribute(i: number, attribute: string) {
        // console.log(i, attribute);
        const attributes = this.form.controls['attributes'].value;
        const newAttributes = [];
        for (let j = 0; j < attributes.length; j++) {
            newAttributes[j] = attributes[j];
        }
        newAttributes[i] = attribute;
        this.form.controls['attributes'].setValue(newAttributes);
    }

    nonNegative(val: number): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {
            return val < 0 ? {'negativeNumber': {value: control.value}} : null;
        };
    }
}
