import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Symbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {DataTypes} from '../../datatype.model';
import {NumericPipe} from './numeric-pipe';
import {ScatterPlotType} from '../../types/scatterplot-type.model';
import {WaveValidators} from '../../../util/form.validators';

@Component({
    selector: 'wave-pie-chart-operator',
    templateUrl: './scatter-plot-operator.component.html',
    styleUrls: ['./scatter-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScatterPlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    pointLayers: Array<Layer<Symbology>>;

    ResultTypes = ResultTypes;
    NumericPipe = NumericPipe;
    DataTypes = DataTypes;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            vLayer: [undefined, Validators.required],
            attribute1: [undefined, Validators.required],
            attribute2: [undefined, Validators.required],
            isRegression: [false, Validators.required],
            name: ["", [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    add() {
        const projection = this.form.controls['vLayer'].value.operator.projection;
        const operator: Operator = new Operator({
            operatorType: new ScatterPlotType({
                attribute1: this.form.controls['attribute1'].value.toString(),
                attribute2: this.form.controls['attribute2'].value.toString(),
                regression: this.form.controls['isRegression'].value.toString(),
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
}
