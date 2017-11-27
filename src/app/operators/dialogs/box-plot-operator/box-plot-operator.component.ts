import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Symbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {DataTypes} from '../../datatype.model';
import {NumericPipe} from '../scatter-plot-operator/scatter-plot-operator.pipe';
import {WaveValidators} from '../../../util/form.validators';
import {BoxPlotType} from '../../types/boxplot-type.model';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
    selector: 'wave-box-plot-operator',
    templateUrl: './box-plot-operator.component.html',
    styleUrls: ['./box-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxPlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    attributes = new BehaviorSubject<Array<string>>([]);

    pointLayers: Array<Layer<Symbology>>;

    ResultTypes = ResultTypes;
    NumericPipe = NumericPipe;
    DataTypes = DataTypes;

    max = 5;

    private subscriptions: Array<Subscription> = [];

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            vLayer: [undefined, Validators.required],
            notch: [false, Validators.required],
            mean: [false, Validators.required],
            range: [1.5, [Validators.required, this.nonNegative]],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
        this.subscriptions.push(
            this.form.controls['vLayer'].valueChanges.subscribe(data => {
                    this.attributes.next([]);
                }
            )
        );
    }

    increase() {
        let normAttribute: string;
        for (let i = 0; i < this.form.controls['vLayer'].value.operator.attributes.size; i++) {
            if (DataTypes.ALL_NUMERICS.indexOf(this.form.controls['vLayer'].value.operator.dataTypes.
                get(this.form.controls['vLayer'].value.operator.attributes.get(i))) >= 0) {
                normAttribute = this.form.controls['vLayer'].value.operator.attributes.get(i);
            }
        }
        if (!normAttribute) {
            this.form.controls['vLayer'].setErrors({'noNumericalAttributes': true});
        }else {
            this.attributes.getValue().push(normAttribute);
        }
    }

    decrease() {
        this.attributes.getValue().pop();
        console.log(this.attributes, this.attributes.getValue());
    }

    add() {
        const projection = this.form.controls['vLayer'].value.operator.projection;
        const operator: Operator = new Operator({
            operatorType: new BoxPlotType({
                notch: this.form.controls['notch'].value,
                mean: this.form.controls['mean'].value,
                range: this.form.controls['range'].value,
                attributes: this.attributes.getValue(),
            }),
            resultType: ResultTypes.PLOT,
            projection: projection,
            pointSources: [this.form.controls['vLayer'].value.operator.getProjectedOperator(projection)],
        });
        const plot = new Plot({
            name: this.form.controls['name'].value,
            operator: operator,
        });
        this.projectService.addPlot(plot);
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.form.updateValueAndValidity({
                onlySelf: false,
                emitEvent: true
            });
            this.form.controls['vLayer'].updateValueAndValidity();
        });
    }

    updateAttribute(i: number, attribute: string) {
    console.log(i, attribute);
    let attributes = this.attributes.getValue();
    const newAttributes = [];
    for (let j = 0; j < attributes.length; j++) {
        newAttributes[j] = attributes[j];
    }
    newAttributes[i] = attribute;
    this.attributes.next(newAttributes);
}

    nonNegative(val: number): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} => {
            return val < 0 ? {'negativeNumber': {value: control.value}} : null;
        };
    }
}
