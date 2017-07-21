/**
 * Created by Julian on 23/06/2017.
 */
import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Symbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {PieChartType} from '../../types/piechart-type.model';

@Component({
    selector: 'wave-pie-chart-operator',
    templateUrl: './pie-chart-operator.component.html',
    styleUrls: ['./pie-chart-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    pointLayers: Array<Layer<Symbology>>;

    ResultTypes = ResultTypes;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            layer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            name: 'Pie chart',
        });
    }

    add() {
        const outputName = this.form.controls['layer'].value.name + ' - ' + this.form.controls['attribute'].value.toString();
        const projection = this.form.controls['layer'].value.operator.projection;
        const operator: Operator = new Operator({
            operatorType: new PieChartType({
                attribute: this.form.controls['attribute'].value.toString(),
            }),
            resultType: ResultTypes.PLOT,
            projection: projection,
            pointSources: [this.form.controls['layer'].value.operator.getProjectedOperator(projection)],
        });
        const plot = new Plot({
            name: outputName,
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
