/**
 * Created by Julian on 23/06/2017.
 */
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {TimePlotType} from '../../types/timeplot-type.model';

@Component({
    selector: 'wave-time-plot-operator',
    templateUrl: './time-plot-operator.component.html',
    styleUrls: ['./time-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimePlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    ResultTypes = ResultTypes;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            layer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            isGrouping: [false, [Validators.required]],
            grouping: [undefined, this.ifEnabled],
        });
    }

    add() {
        const sourceOperator: Operator = this.form.controls['layer'].value.operator;

        const operator: Operator = new Operator({
            operatorType: new TimePlotType({
                attribute: this.form.controls['attribute'].value.toString(),
                isGrouping: this.form.controls['isGrouping'].value,
                grouping: this.form.controls['isGrouping'].value ? this.form.controls['grouping'].value.toString() : null,
                time: 'DateLastEdited',
                inputType: sourceOperator.resultType,
            }),
            resultType: ResultTypes.PLOT,
            projection: sourceOperator.projection,
            pointSources: sourceOperator.resultType === ResultTypes.POINTS ? [sourceOperator] : undefined,
            lineSources: sourceOperator.resultType === ResultTypes.LINES ? [sourceOperator] : undefined,
            polygonSources: sourceOperator.resultType === ResultTypes.POLYGONS ? [sourceOperator] : undefined,
        });

        const plot = new Plot({
            name: this.form.controls['name'].value.toString(),
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
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ifEnabled(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} => {
            return !control.value && !this.form.controls['isGrouping'] ? {'valueRequired': {value: control.value}} : null;
        };
    }
}
