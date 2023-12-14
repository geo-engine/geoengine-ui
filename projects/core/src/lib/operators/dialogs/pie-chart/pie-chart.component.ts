import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap, tap} from 'rxjs/operators';
import {Plot} from '../../../plots/plot.model';
import {NotificationService} from '../../../notification.service';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {WorkflowDict} from '../../../backend/backend.model';
import {PieChartCountParams, PieChartDict} from '../../../backend/operator.model';

interface PieChartForm {
    name: FormControl<string>;
    type: FormControl<'count'>;
    layer: FormControl<VectorLayer | undefined>;
    attribute: FormControl<string | undefined>;
    donut: FormControl<boolean>;
}

/**
 * This dialog allows creating a histogram plot of a layer's values.
 */
@Component({
    selector: 'geoengine-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit, OnDestroy {
    minNumberOfBuckets = 1;
    maxNumberOfBuckets = 100;

    inputTypes = ResultTypes.INPUT_TYPES;

    form: FormGroup<PieChartForm>;

    attributes$ = new ReplaySubject<Array<string>>(1);

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
    ) {
        this.form = new FormGroup({
            name: new FormControl('Filtered Values', {
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                nonNullable: true,
            }),
            layer: new FormControl<VectorLayer | undefined>(undefined, {
                validators: [Validators.required],
                nonNullable: true,
            }),
            type: new FormControl('count', {
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                nonNullable: true,
            }),
            attribute: new FormControl<string | undefined>(undefined, {
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                nonNullable: true,
            }),
            donut: new FormControl(false, {
                validators: Validators.required,
                nonNullable: true,
            }),
        });

        this.form.controls['type'].disable(); // TODO: remove when other options are available

        this.subscriptions.push(
            this.form.controls.layer.valueChanges
                .pipe(
                    tap({
                        next: () => this.form.controls.attribute.setValue(undefined),
                    }),
                    mergeMap((layer: VectorLayer | undefined) => {
                        if (!layer || !(layer instanceof VectorLayer)) {
                            return of([]);
                        }

                        return this.projectService
                            .getVectorLayerMetadata(layer)
                            .pipe(map((metadata: VectorLayerMetadata) => metadata.dataTypes.keySeq().toArray()));
                    }),
                )
                .subscribe((attributes) => this.attributes$.next(attributes)),
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    /**
     * Uses the user input to create a histogram plot.
     * The plot is added to the plot view.
     */
    add(): void {
        const inputLayer = this.form.controls['layer'].value;
        const columnName = this.form.controls['attribute'].value;

        if (!inputLayer || !columnName) {
            return;
        }

        const pieChartType = this.form.controls['type'].value;
        const donut = this.form.controls['donut'].value;
        const outputName: string = this.form.controls['name'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Plot',
                        operator: {
                            type: 'PieChart',
                            params: {
                                type: pieChartType,
                                columnName,
                                donut,
                            } as PieChartCountParams,
                            sources: {
                                vector: inputWorkflow.operator,
                            },
                        } as PieChartDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addPlot(
                        new Plot({
                            workflowId,
                            name: outputName,
                        }),
                    ),
                ),
            )
            .subscribe(
                () => {
                    // success
                },
                (error) => this.notificationService.error(error),
            );
    }
}
