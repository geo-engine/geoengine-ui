import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {RasterMetadataKey, RasterUnScalingDict} from '../../../backend/operator.model';
import {RasterDataTypes} from '../../datatype.model';
import {SymbologyCreatorComponent} from '../../../layers/symbology/symbology-creator/symbology-creator.component';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';

interface RasterScalingForm {
    name: FormControl<string>;
    layer: FormControl<RasterLayer | undefined>;
    slope: FormGroup<ScaleOffsetForm>;
    offset: FormGroup<ScaleOffsetForm>;
    scaleType: FormControl<{formula: string; type: 'mulSlopeAddOffset' | 'subOffsetDivSlope'}>;
}

interface ScaleOffsetForm {
    scaleOffsetSelection: FormControl<'auto' | 'metadataKey' | 'constant'>;
    domain: FormControl<string>;
    key: FormControl<string>;
    constant: FormControl<number>;
}

@Component({
    selector: 'geoengine-raster-scaling',
    templateUrl: './raster-scaling.component.html',
    styleUrls: ['./raster-scaling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterScalingComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    readonly scaleTypes: Array<{formula: string; type: 'mulSlopeAddOffset' | 'subOffsetDivSlope'}> = [
        {formula: 'p_new = (p_old - offset)/slope', type: 'subOffsetDivSlope'},
        {formula: 'p_new = p_old * slope + offset', type: 'mulSlopeAddOffset'},
    ];

    readonly scaleOffsetSelectionTypes: Array<'auto' | 'constant' | 'metadataKey'> = ['auto', 'constant', 'metadataKey'];

    readonly validRasterMetadataKeyValidator = geoengineValidators.validRasterMetadataKey;
    readonly isNumberValidator = geoengineValidators.isNumber;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    @ViewChild(SymbologyCreatorComponent)
    readonly symbologyCreator!: SymbologyCreatorComponent;

    form: FormGroup<RasterScalingForm>;
    disallowSubmit: Observable<boolean>;

    constructor(private readonly projectService: ProjectService, private readonly notificationService: NotificationService) {
        this.form = new FormGroup<RasterScalingForm>({
            name: new FormControl<string>('', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
            layer: new FormControl<RasterLayer | undefined>(undefined, {validators: Validators.required, nonNullable: true}),
            slope: new FormGroup<ScaleOffsetForm>(
                {
                    scaleOffsetSelection: new FormControl<'auto' | 'metadataKey' | 'constant'>('auto', {
                        validators: [Validators.required],
                        nonNullable: true,
                    }),
                    domain: new FormControl<string>('', {
                        validators: [Validators.pattern('[a-zA-Z0-9_]*')],
                        nonNullable: true,
                    }),
                    key: new FormControl<string>('slope', {
                        validators: [Validators.required, Validators.pattern('[a-zA-Z0-9_]+')],
                        nonNullable: true,
                    }),
                    constant: new FormControl<number>(1, {validators: geoengineValidators.isNumber, nonNullable: true}),
                },
                {validators: [this.numberOrMetadataKeyValidator]},
            ),
            offset: new FormGroup<ScaleOffsetForm>(
                {
                    scaleOffsetSelection: new FormControl<'auto' | 'metadataKey' | 'constant'>('auto', {
                        validators: [Validators.required],
                        nonNullable: true,
                    }),
                    domain: new FormControl<string>('', {
                        validators: [Validators.pattern('[a-zA-Z0-9_]*')],
                        nonNullable: true,
                    }),
                    key: new FormControl<string>('offset', {
                        validators: [geoengineValidators.notOnlyWhitespace, geoengineValidators.validRasterMetadataKey],
                        nonNullable: true,
                    }),
                    constant: new FormControl<number>(0, {validators: geoengineValidators.isNumber, nonNullable: true}),
                },
                {validators: [this.numberOrMetadataKeyValidator]},
            ),
            scaleType: new FormControl(this.scaleTypes[0], {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    numberOrMetadataKeyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const isauto = control.get('scaleOffsetSelection')?.value === 'auto';
        if (isauto) {
            return null;
        }

        const isByKey = control.get('scaleOffsetSelection')?.value === 'metadataKey';
        const key = control.get('key');
        const constant = control.get('constant');

        if (isByKey && key) {
            return geoengineValidators.validRasterMetadataKey(key);
        }
        if (!isByKey && constant) {
            return geoengineValidators.isNumber(constant);
        }

        return {numberOrMetadataKey: true};
    };

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
            this.form.controls['scaleType'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {}

    formGroupToDict(fg: AbstractControl): RasterMetadataKey | {type: 'constant'; value: number} | {type: 'auto'} {
        if (fg.get('scaleOffsetSelection')?.value === 'auto') {
            return {type: 'auto'};
        } else if (fg.get('scaleOffsetSelection')?.value === 'metadataKey') {
            const key = fg.get('key')?.value;
            const domain = fg.get('domain')?.value;
            return {type: 'metadataKey', domain, key};
        } else {
            return {type: 'constant', value: fg.get('constant')?.value};
        }
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const inputLayer: RasterLayer | undefined = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const slope = this.formGroupToDict(this.form.controls.slope);
        const offset = this.formGroupToDict(this.form.controls.offset);

        const scaleType = this.form.controls.scaleType.value;

        if (!inputLayer) {
            return; // checked by form validator
        }

        this.loading$.next(true);

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'RasterScaling',
                            params: {
                                slope,
                                offset,
                                scalingMode: scaleType.type,
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as RasterUnScalingDict,
                    }),
                ),
                mergeMap((workflowId: UUID) => {
                    const symbology$: Observable<RasterSymbology> = this.symbologyCreator.symbologyForRasterLayer(workflowId, inputLayer);

                    return combineLatest([of(workflowId), symbology$]);
                }),
                mergeMap(([workflowId, symbology]: [UUID, RasterSymbology]) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: outputName,
                            symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
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
