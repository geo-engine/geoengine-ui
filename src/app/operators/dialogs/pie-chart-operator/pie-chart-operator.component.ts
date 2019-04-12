/**
 * Created by Julian on 23/06/2017.
 */
import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {PieChartType} from '../../types/piechart-type.model';
import {WaveValidators} from '../../../util/form.validators';

@Component({
    selector: 'wave-pie-chart-operator',
    templateUrl: './pie-chart-operator.component.html',
    styleUrls: ['./pie-chart-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    pointLayers: Array<Layer<AbstractSymbology>>;

    ResultTypes = ResultTypes;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            layer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    add(event: any) {
        const sourceOperator: Operator = this.form.controls['layer'].value.operator;

        const operator: Operator = new Operator({
            operatorType: new PieChartType({
                attribute: this.form.controls['attribute'].value.toString(),
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
}
