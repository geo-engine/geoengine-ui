/**
 * Created by Julian on 23/06/2017.
 */
import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ResultTypes, ResultType} from '../../result-type.model';
import {Symbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Observable, ReplaySubject} from 'rxjs';
import {Operator} from '../../operator.model';
import {RScriptType} from '../../types/r-script-type.model';
import {Map} from 'immutable';
import {DataType} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {Projections} from '../../projection.model';
import {PieChartType} from '../../types/piechart-type.model';

@Component({
    selector: 'wave-pie-chart-operator',
    templateUrl: './pie-chart-operator.component.html',
    styleUrls: ['./pie-chart-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent implements OnInit, AfterViewInit, OnDestroy{

    form: FormGroup;

    pointLayers: Array<Layer<Symbology>>;

    ResultTypes = ResultTypes;

    constructor(private formBuilder: FormBuilder,
                private _changeDetectorRef: ChangeDetectorRef,
                private projectService: ProjectService) {}

    ngOnInit() {
        this.pointLayers = this.projectService.getLayers().filter((layer: Layer<Symbology>) => {
            return (layer.operator.resultType === ResultTypes.POINTS);
        });
        const layerControl = this.formBuilder.control(undefined, Validators.required);
        const attributeControl = this.formBuilder.control(undefined, Validators.required);

        if (this.pointLayers.length > 0)
            layerControl.setValue(this.pointLayers[0]);


        this.form = this.formBuilder.group({
            layer: layerControl,
            attribute: attributeControl,
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
        this.form.updateValueAndValidity({
            onlySelf: false,
            emitEvent: true
        });
        setTimeout(() => {
            this._changeDetectorRef.reattach();
            this._changeDetectorRef.detectChanges();
        }, 10);
    }
}
