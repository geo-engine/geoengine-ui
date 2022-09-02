import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {map, mergeMap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {WorkflowDict} from '../../../backend/backend.model';
import {Observable} from 'rxjs';
import {RasterTypeConversionDict} from '../../../backend/operator.model';
import {RasterDataType, RasterDataTypes} from '../../datatype.model';
import {Layer} from 'ol/layer';

@Component({
    selector: 'wave-raster-type-conversion',
    templateUrl: './raster-type-conversion.component.html',
    styleUrls: ['./raster-type-conversion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterTypeConversionComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    form: FormGroup;
    disallowSubmit: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
            layer: new FormControl<Layer | null>(null, {validators: Validators.required}),
            dataType: new FormControl(this.rasterDataTypes[0], {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
        this.disallowSubmit = this.form.statusChanges.pipe(map((status) => status !== 'VALID'));
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
            this.form.controls['dataType'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {}

    add(): void {
        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const outputDataType: RasterDataType = this.form.controls['dataType'].value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'RasterTypeConversion',
                            params: {
                                outputDataType: outputDataType.getCode(),
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as RasterTypeConversionDict,
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
