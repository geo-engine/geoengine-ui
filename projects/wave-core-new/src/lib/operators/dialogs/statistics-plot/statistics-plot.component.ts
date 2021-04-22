import {Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {ResultTypes} from '../../result-type.model';
import {Layer} from '../../../layers/layer.model';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {WorkflowDict} from '../../../backend/backend.model';
import {map, mergeMap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {NotificationService} from '../../../notification.service';

@Component({
    selector: 'wave-statistics-plot',
    templateUrl: './statistics-plot.component.html',
    styleUrls: ['./statistics-plot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPlotComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly allowedLayerTypes = [ResultTypes.RASTER];

    readonly subscriptions: Array<Subscription> = [];

    form: FormGroup;
    outputNameSuggestion: Observable<string>;

    constructor(
        private formBuilder: FormBuilder,
        private projectService: ProjectService,
        private notificationService: NotificationService,
    ) {
        this.form = this.formBuilder.group({
            layers: [undefined, Validators.required],
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });

        this.outputNameSuggestion = StatisticsPlotComponent.createOutputNameSuggestionStream(this.form.controls['layers'].valueChanges);
    }

    ngOnInit(): void {}

    add(): void {
        const workflowObservables: Array<Observable<WorkflowDict>> = this.form.controls['layers'].value.map((layer: Layer) =>
            this.projectService.getWorkflow(layer.workflowId),
        );

        combineLatest(workflowObservables)
            .pipe(
                mergeMap((workflows) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'Statistics',
                            params: {},
                            rasterSources: workflows.map((workflow) => workflow.operator),
                            vectorSources: [],
                        },
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addPlot(
                        new Plot({
                            workflowId,
                            name: this.form.controls['name'].value.toString(),
                        }),
                    ),
                ),
            )
            .subscribe(
                () => {},
                (error) => this.notificationService.error(error),
            );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity({
                onlySelf: false,
                emitEvent: true,
            });
            this.form.controls['layers'].updateValueAndValidity();
        });
    }

    private static createOutputNameSuggestionStream(layersChanges: Observable<Array<Layer>>): Observable<string> {
        return layersChanges.pipe(
            map((layers) => {
                if (!layers) {
                    return 'Statistics';
                }

                return `Statistics of ${layers.map((layer) => layer.name).join(', ')}`;
            }),
        );
    }
}
