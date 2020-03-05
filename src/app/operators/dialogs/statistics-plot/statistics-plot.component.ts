import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {StatisticsType} from '../../types/statistics-type.model';

@Component({
    selector: 'wave-statistics-plot',
    templateUrl: './statistics-plot.component.html',
    styleUrls: ['./statistics-plot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsPlotComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup;

    ResultTypes = ResultTypes;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            layer: [undefined, Validators.required],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    add() {
        const sourceOperator: Operator = this.form.controls['layer'].value.operator;
        const operator: Operator = new Operator({
            operatorType: new StatisticsType({
                raster_height: 256,
                raster_width: 256
            }),
            resultType: ResultTypes.PLOT,
            projection: sourceOperator.projection,
            pointSources: sourceOperator.resultType === ResultTypes.POINTS ? [sourceOperator] : undefined,
            lineSources: sourceOperator.resultType === ResultTypes.LINES ? [sourceOperator] : undefined,
            polygonSources: sourceOperator.resultType === ResultTypes.POLYGONS ? [sourceOperator] : undefined,
            rasterSources: sourceOperator.resultType === ResultTypes.RASTER ? [sourceOperator] : undefined,
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
