import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators, ControlValueAccessor} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {DataTypes} from '../../datatype.model';
import {WaveValidators} from '../../../util/form.validators';
import {BoxPlotType} from '../../types/boxplot-type.model';
import {BehaviorSubject, Subscription} from 'rxjs';

@Component({
    selector: 'wave-box-plot-operator',
    templateUrl: './box-plot-operator.component.html',
    styleUrls: ['./box-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxPlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;
    layers: Array<Layer<AbstractSymbology>>;
    ResultTypes = ResultTypes;
    DataTypes = DataTypes;
    selectedLayers = new BehaviorSubject<Array<{ attr: string }>>([]);
    hasNumerics = new BehaviorSubject<Boolean>(false);
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
            this.form.controls['vLayer'].valueChanges.subscribe(change => {
                this.selectedLayers.next(new Array());
                let numerics = false;
                const inputOperator = change.operator as Operator;
                let it = inputOperator.dataTypes.entries();
                let curr: {done: boolean, value: any};
                while (!(curr = it.next()).done) {
                    let k = this.DataTypes.ALL_NUMERICS.indexOf(curr.value[1]);
                    if (k >= 0) {
                        numerics = true;
                        break;
                    }
                }
                this.hasNumerics.next(numerics);
            }),
        );

    }

    increase() {
        const inputOperator = this.form.controls['vLayer'].value.operator as Operator;

        let it = inputOperator.dataTypes.entries();
        let curr: {done: boolean, value: any};
        let numericAttribute: string;
        while (!(curr = it.next()).done) {
            let k = this.DataTypes.ALL_NUMERICS.indexOf(curr.value[1]);
            if (k >= 0) {
                numericAttribute = curr.value[0];
                if (this.attrIndexOf(numericAttribute) < 0) {
                    break;
                }
            }
        }

        // const [numericAttribute] = inputOperator.dataTypes.findEntry((value) => {
        //     return this.DataTypes.ALL_NUMERICS.indexOf(value) >= 0;
        // }) as [string, DataType];
        // TODO: propose unused attribute


        if (numericAttribute) {
            const newSelectedLayers = [...this.selectedLayers.getValue()];
            newSelectedLayers[this.selectedLayers.getValue().length] = {attr: numericAttribute};
            this.selectedLayers.next(newSelectedLayers);
        } else {
            this.form.controls['vLayer'].setErrors({'noNumericalAttributes': true});
        }
    }

    decrease() {
        this.selectedLayers.next(this.selectedLayers.getValue().slice(0, this.selectedLayers.getValue().length - 1));
    }

    add(event: any) {
        const sourceOperator = this.form.controls['vLayer'].value.operator;
        const selectedLayers = new Array<string>();
        for (let item of this.selectedLayers.getValue()) {
            selectedLayers.push(item.attr);
        }
        const operator: Operator = new Operator({
            operatorType: new BoxPlotType({
                notch: this.form.controls['notch'].value,
                mean: this.form.controls['mean'].value,
                range: this.form.controls['range'].value,
                attributes: selectedLayers,
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
        const newSelectedLayers  = [...this.selectedLayers.getValue()];
        newSelectedLayers[i] = {attr: attribute};
        this.selectedLayers.next(newSelectedLayers);
    }

    nonNegative(val: number): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {
            return val < 0 ? {'negativeNumber': {value: control.value}} : null;
        };
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private attrIndexOf(obj: string) {
        let arr = this.selectedLayers.getValue();
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].attr === obj) {
                return i;
            }
        }
        return -1;
    }
}
