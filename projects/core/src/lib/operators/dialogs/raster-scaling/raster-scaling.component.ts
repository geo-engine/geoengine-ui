import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {WorkflowDict} from '../../../backend/backend.model';
import {Observable} from 'rxjs';
import {RasterMetadataKey, RasterUnScalingDict} from '../../../backend/operator.model';
import {RasterDataTypes} from '../../datatype.model';
import {Layer} from 'ol/layer';

@Component({
    selector: 'geoengine-raster-scaling',
    templateUrl: './raster-scaling.component.html',
    styleUrls: ['./raster-scaling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterScalingComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    readonly scaleTypes: Array<{formular: string; type: 'scale' | 'unscale'}> = [
        {formular: 'p_new = (p_old - offset)/slope', type: 'scale'},
        {formular: 'p_new = p_old * slope + offset', type: 'unscale'},
    ];

    readonly validRasterMetadataKeyValidator = geoengineValidators.validRasterMetadataKey;
    readonly isNumberValidator = geoengineValidators.isNumber;

    form: FormGroup;
    disallowSubmit: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: new FormControl<Layer | null>(null, {validators: Validators.required}),
            scale: this.formBuilder.group(
                {
                    byKey: [false],
                    domain: new FormControl<string>(
                        {value: '', disabled: true},
                        {
                            validators: [Validators.pattern('[a-zA-Z0-9_]*')],
                        },
                    ),
                    key: new FormControl<string>(
                        {value: 'scale', disabled: true},
                        {
                            validators: [Validators.required, Validators.pattern('[a-zA-Z0-9_]+')],
                        },
                    ),
                    constant: new FormControl<number>(1, {validators: geoengineValidators.isNumber}),
                },
                {validators: [this.numberOrMetadataKeyValidator]},
            ),
            offset: this.formBuilder.group(
                {
                    byKey: [false],
                    domain: new FormControl<string>(
                        {value: '', disabled: true},
                        {
                            validators: [Validators.pattern('[a-zA-Z0-9_]*')],
                        },
                    ),
                    key: new FormControl<string>(
                        {value: 'offset', disabled: true},
                        {
                            validators: [geoengineValidators.notOnlyWhitespace, geoengineValidators.validRasterMetadataKey],
                        },
                    ),
                    constant: new FormControl<number>(0, {validators: geoengineValidators.isNumber}),
                },
                {validators: [this.numberOrMetadataKeyValidator]},
            ),
            scaleType: new FormControl(this.scaleTypes[0], {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
        this.form.controls.scale.get('byKey')?.valueChanges.subscribe((byKey: boolean) => {
            const keyControl = this.form.controls.scale.get('key');
            const domainControl = this.form.controls.scale.get('domain');
            const constantControl = this.form.controls.scale.get('constant');
            if (byKey) {
                keyControl?.enable();
                domainControl?.enable();
                constantControl?.disable();
            } else {
                keyControl?.disable();
                domainControl?.disable();
                constantControl?.enable();
            }
        });

        this.form.controls.offset.get('byKey')?.valueChanges.subscribe((byKey: boolean) => {
            const keyControl = this.form.controls.offset.get('key');
            const domainControl = this.form.controls.offset.get('domain');
            const constantControl = this.form.controls.offset.get('constant');
            if (byKey) {
                keyControl?.enable();
                domainControl?.enable();
                constantControl?.disable();
            } else {
                keyControl?.disable();
                domainControl?.disable();
                constantControl?.enable();
            }
        });
    }

    numberOrMetadataKeyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const isByKey = control.get('isByKey')?.value;
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
        });
    }

    ngOnDestroy(): void {}

    formGroupToDict(fg: AbstractControl): RasterMetadataKey | {type: 'constant'; value: number} {
        if (fg.get('byKey')?.value) {
            const key = fg.get('key')?.value;
            const domain = fg.get('domain')?.value;
            return {type: 'metadataKey', domain, key};
        } else {
            return {type: 'constant', value: fg.get('constant')?.value};
        }
    }

    add(): void {
        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const scale = this.formGroupToDict(this.form.controls.scale);
        const offset = this.formGroupToDict(this.form.controls.offset);

        const scaleType = this.form.controls.scaleType.value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'RasterScaling',
                            params: {
                                scaleWith: scale,
                                offsetBy: offset,
                                scalingMode: scaleType,
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as RasterUnScalingDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: outputName,
                            symbology: inputLayer.symbology.clone(),
                            isLegendVisible: false,
                            isVisible: true,
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
