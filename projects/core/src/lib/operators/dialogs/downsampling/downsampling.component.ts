import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators, ValidatorFn} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';

import {mergeMap, tap} from 'rxjs/operators';
import {UUID} from '../../../backend/backend.model';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {Layer} from 'ol/layer';
import {SymbologyCreatorComponent} from '../../../layers/symbology/symbology-creator/symbology-creator.component';
import {
    OutputResolutionDict,
    DownsamplingDict,
    RasterDataTypes,
    RasterLayer,
    RasterSymbology,
    ResultTypes,
    geoengineValidators,
    NotificationService,
} from '@geoengine/common';
import {Workflow as WorkflowDict} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-downsampling',
    templateUrl: './downsampling.component.html',
    styleUrls: ['./downsampling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DownsamplingComponent implements AfterViewInit, OnDestroy {
    readonly downsamplingMethods = [['Nearest Neighbor', 'nearestNeighbor']];
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    @ViewChild(SymbologyCreatorComponent)
    readonly symbologyCreator!: SymbologyCreatorComponent;

    form: FormGroup;

    private subscription!: Subscription;

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, geoengineValidators.notOnlyWhitespace]],
            layer: new FormControl<Layer | null>(null, {validators: Validators.required}),
            downsamplingMethod: new FormControl(this.downsamplingMethods[0][1], {
                nonNullable: true,
                validators: [Validators.required],
            }),
            outputResolution: new FormControl('fraction', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            outputResolutionX: new FormControl(1.0, {
                nonNullable: true,
                validators: [this.resolutionValidator()],
            }),
            outputResolutionY: new FormControl(1.0, {
                nonNullable: true,
                validators: [this.resolutionValidator()],
            }),
        });
        this.subscription = this.form.controls['outputResolution'].statusChanges
            .pipe(
                tap((_) => {
                    this.form.updateValueAndValidity();
                    this.form.controls['outputResolutionX'].updateValueAndValidity();
                    this.form.controls['outputResolutionY'].updateValueAndValidity();
                }),
            )
            .subscribe();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.form.controls['layer'].updateValueAndValidity();
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const inputLayer: RasterLayer = this.form.controls['layer'].value;
        const outputName: string = this.form.controls['name'].value;

        const downsamplingMethod: string = this.form.controls['downsamplingMethod'].value;

        const outputResolution: OutputResolutionDict = this.getoutputResolution();

        this.loading$.next(true);

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'Downsampling',
                            params: {
                                samplingMethod: downsamplingMethod,
                                outputResolution,
                                outputOriginReference: undefined,
                            },
                            sources: {
                                raster: inputWorkflow.operator,
                            },
                        } as DownsamplingDict,
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
                    this.notificationService.error(error.error ? error.error.message : error);

                    this.loading$.next(false);
                },
            });
    }

    private getoutputResolution(): OutputResolutionDict {
        const outputResolution = this.form.controls['outputResolution'].value;

        if (outputResolution === 'fraction') {
            return {
                type: 'fraction',
                x: this.form.controls['outputResolutionX'].value,
                y: this.form.controls['outputResolutionY'].value,
            };
        } else if (outputResolution === 'resolution') {
            return {
                type: 'resolution',
                x: this.form.controls['outputResolutionX'].value,
                y: this.form.controls['outputResolutionY'].value,
            };
        }

        throw Error('Invalid input resolution');
    }

    private resolutionValidator(): ValidatorFn {
        const validator = Validators.compose([Validators.required, geoengineValidators.largerThan(0.0)]);

        if (!validator) {
            throw Error('Invalid validator');
        }

        return geoengineValidators.conditionalValidator(
            validator,
            () => this.form?.get('outputResolution')?.value === 'fraction' || this.form?.get('outputResolution')?.value === 'resolution',
        );
    }
}
