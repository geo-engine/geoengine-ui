import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {DataTypes} from '../../datatype.model';
import {ScatterPlotType} from '../../types/scatterplot-type.model';
import {WaveValidators} from '../../../util/form.validators';

@Component({
    selector: 'wave-scatter-plot-operator',
    templateUrl: './scatter-plot-operator.component.html',
    styleUrls: ['./scatter-plot-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScatterPlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;
    ResultTypes = ResultTypes;
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
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    add(event: any) {
        const sourceOperator: Operator = this.form.controls['vLayer'].value.operator;

        const operator: Operator = new Operator({
            operatorType: new ScatterPlotType({
                attribute1: this.form.controls['attribute1'].value.toString(),
                attribute2: this.form.controls['attribute2'].value.toString(),
                regression: this.form.controls['isRegression'].value,
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
