import {Layer, RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {TimeStepGranularityDict, WorkflowDict} from '../../../backend/backend.model';
import {BehaviorSubject, Observable} from 'rxjs';
import {AbsoluteTimeShiftDictParams, RelativeTimeShiftDictParams, TimeShiftDict} from '../../../backend/operator.model';
import moment from 'moment';
import {RasterSymbology, VectorSymbology} from '../../../layers/symbology/symbology.model';
import {Time} from '../../../time/time.model';

type TimeShiftFormType = 'relative' | 'absolute';

interface TimeShiftForm {
    name: FormControl<string>;
    source: FormControl<Layer | undefined>;
    type: FormControl<TimeShiftFormType>;
}

interface AbsoluteTimeShiftForm extends TimeShiftForm {
    type: FormControl<'absolute'>;
    timeIntervalStart: FormControl<moment.Moment>;
    timeIntervalEnd: FormControl<moment.Moment>;
}

interface RelativeTimeShiftForm extends TimeShiftForm {
    type: FormControl<'relative'>;
    granularity: FormControl<TimeStepGranularityDict>;
    value: FormControl<number>;
}

@Component({
    selector: 'geoengine-time-shift',
    templateUrl: './time-shift.component.html',
    styleUrls: ['./time-shift.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeShiftComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER, ...ResultTypes.VECTOR_TYPES];

    readonly timeGranularityOptions: Array<TimeStepGranularityDict> = ['millis', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    readonly defaultTimeGranularity: TimeStepGranularityDict = 'months';

    readonly defaultTimeShiftType: TimeShiftFormType = 'relative';

    readonly loading$ = new BehaviorSubject<boolean>(false);

    form: FormGroup<AbsoluteTimeShiftForm> | FormGroup<RelativeTimeShiftForm>;
    disallowSubmit: Observable<boolean>;

    constructor(private readonly projectService: ProjectService, private readonly notificationService: NotificationService) {
        const form: FormGroup<RelativeTimeShiftForm> = new FormGroup({
            name: new FormControl('Time Shift', {
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
                nonNullable: true,
            }),
            source: new FormControl<Layer | undefined>(undefined, {validators: Validators.required, nonNullable: true}),
            type: new FormControl('relative', {validators: Validators.required, nonNullable: true}),
            granularity: new FormControl(this.defaultTimeGranularity, {validators: Validators.required, nonNullable: true}),
            value: new FormControl(-1, {validators: Validators.required, nonNullable: true}),
        });
        this.form = form;
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['source'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {}

    changeShiftType(type: TimeShiftFormType): void {
        if (type === 'relative') {
            this.changeToRelative();
        } else if (type === 'absolute') {
            this.changeToAbsolute();
        }
    }

    changeToRelative(): void {
        const typeControl: FormControl<TimeShiftFormType> = this.form.controls['type'];

        this.form = new FormGroup<RelativeTimeShiftForm>({
            name: this.form.controls['name'],
            source: this.form.controls['source'],
            type: typeControl as FormControl<'relative'>,
            granularity: new FormControl(this.defaultTimeGranularity, {validators: Validators.required, nonNullable: true}),
            value: new FormControl(-1, {validators: Validators.required, nonNullable: true}),
        });

        typeControl.setValue('relative');
    }

    changeToAbsolute(): void {
        const typeControl: FormControl<TimeShiftFormType> = this.form.controls['type'];

        this.form = new FormGroup<AbsoluteTimeShiftForm>({
            name: this.form.controls['name'],
            source: this.form.controls['source'],
            type: typeControl as FormControl<'absolute'>,
            timeIntervalStart: new FormControl(moment.utc('2014-01-01'), {validators: Validators.required, nonNullable: true}),
            timeIntervalEnd: new FormControl(moment.utc('2014-01-01'), {validators: Validators.required, nonNullable: true}),
        });

        typeControl.setValue('absolute');
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const sourceLayer: Layer | undefined = this.form.controls['source'].value;

        if (!sourceLayer) {
            return; // should be captured by form validation
        }

        const outputName: string = this.form.controls['name'].value;
        const type: TimeShiftFormType = this.form.controls['type'].value;

        let params: AbsoluteTimeShiftDictParams | RelativeTimeShiftDictParams;

        if (type === 'absolute') {
            const form: FormGroup<AbsoluteTimeShiftForm> = this.form as FormGroup<AbsoluteTimeShiftForm>;
            const time = new Time(form.controls['timeIntervalStart'].value, form.controls['timeIntervalEnd'].value);
            params = {
                type,
                timeInterval: time.toDict(),
            } as AbsoluteTimeShiftDictParams;
        } else if (type === 'relative') {
            const form: FormGroup<RelativeTimeShiftForm> = this.form as FormGroup<RelativeTimeShiftForm>;
            params = {
                type,
                granularity: form.controls['granularity'].value,
                value: form.controls['value'].value,
            } as RelativeTimeShiftDictParams;
        } else {
            throw Error(`Invalid time shift type ${type}`);
        }

        let layerType: 'Vector' | 'Raster';
        if (sourceLayer.layerType === 'raster') {
            layerType = 'Raster';
        } else if (sourceLayer.layerType === 'vector') {
            layerType = 'Vector';
        } else {
            throw Error(`Invalid layer type ${sourceLayer.layerType}`);
        }

        this.loading$.next(true);

        this.projectService
            .getWorkflow(sourceLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: layerType,
                        operator: {
                            type: 'TimeShift',
                            params,
                            sources: {
                                source: inputWorkflow.operator,
                            },
                        } as TimeShiftDict,
                    }),
                ),
                mergeMap((workflowId) => {
                    if (layerType === 'Vector') {
                        return this.projectService.addLayer(
                            new VectorLayer({
                                workflowId,
                                name: outputName,
                                symbology: sourceLayer.symbology as VectorSymbology,
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    } else if (layerType === 'Raster') {
                        return this.projectService.addLayer(
                            new RasterLayer({
                                workflowId,
                                name: outputName,
                                symbology: sourceLayer.symbology as RasterSymbology,
                                isLegendVisible: false,
                                isVisible: true,
                            }),
                        );
                    } else {
                        throw Error(`Invalid layer type ${layerType}`);
                    }
                }),
            )
            .subscribe({
                next: () => {
                    // success
                    this.loading$.next(false);
                },
                error: (error) => {
                    this.notificationService.error(error);
                    this.loading$.next(false);
                },
            });
    }
}
