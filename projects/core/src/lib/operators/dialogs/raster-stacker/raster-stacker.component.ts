import {RasterLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AfterViewInit, ChangeDetectionStrategy, Component} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {geoengineValidators} from '../../../util/form.validators';
import {map, mergeMap, tap} from 'rxjs/operators';
import {NotificationService} from '../../../notification.service';
import {OperatorDict, SourceOperatorDict} from '../../../backend/backend.model';
import {BehaviorSubject, EMPTY, Observable, combineLatest, of} from 'rxjs';
import {RasterStackerDict, RasterTypeConversionDict} from '../../../backend/operator.model';
import {RasterDataType, RasterDataTypes} from '../../datatype.model';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {RasterLayerMetadata} from '../../../layers/layer-metadata.model';

interface RasterStackerForm {
    rasterLayers: FormControl<Array<RasterLayer> | undefined>;
    name: FormControl<string>;
    dataType: FormControl<RasterDataType | undefined>;
}

@Component({
    selector: 'geoengine-raster-stacker',
    templateUrl: './raster-stacker.component.html',
    styleUrls: ['./raster-stacker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterStackerComponent implements AfterViewInit {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly rasterDataTypes = RasterDataTypes.ALL_DATATYPES;

    readonly form: FormGroup<RasterStackerForm>;

    readonly outputDataTypes$: Observable<Array<[RasterDataType, string]>>;

    readonly loading$ = new BehaviorSubject<boolean>(false);

    private inputDataTypes: Array<RasterDataType> = [];

    constructor(
        private readonly projectService: ProjectService,
        private readonly notificationService: NotificationService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.form = new FormGroup<RasterStackerForm>({
            rasterLayers: new FormControl<Array<RasterLayer> | undefined>(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),

            dataType: new FormControl(undefined, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('Stacked raster bands', {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.notOnlyWhitespace],
            }),
        });

        // TODO: also update when layer selection changes and not only when new layer is added
        this.outputDataTypes$ = this.form.controls.rasterLayers.valueChanges.pipe(
            mergeMap((rasterLayers: Array<RasterLayer> | undefined) => {
                if (!rasterLayers) {
                    return EMPTY;
                }

                const metaData = rasterLayers.map((l) => this.projectService.getRasterLayerMetadata(l));
                return combineLatest(metaData);
            }),
            map((rasterLayers: Array<RasterLayerMetadata>) => {
                this.inputDataTypes = rasterLayers.map((layer) => layer.dataType);

                const outputDataTypes: Array<[RasterDataType, string]> = RasterDataTypes.ALL_DATATYPES.map((dataType: RasterDataType) => [
                    dataType,
                    '',
                ]);

                for (const output of outputDataTypes) {
                    const outputDataType = output[0];

                    const indices = rasterLayers
                        .map((layer, index) => (layer.dataType === outputDataType ? index : -1))
                        .filter((index) => index >= 0)
                        .map((index) => LetterNumberConverter.toLetters(index + 1));

                    if (indices.length > 0) {
                        output[1] = `(like ${indices.length > 1 ? 'layers' : 'layer'} ${indices.join(', ')})`;
                    }
                }
                return [rasterLayers, outputDataTypes] as [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>];
            }),
            tap(([rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => {
                const dataTypeControl = this.form.controls.dataType;
                const currentDataType: RasterDataType | undefined = dataTypeControl.value;
                const rasterDataTypes = rasterLayers.map((layer) => layer.dataType);
                if (currentDataType && rasterDataTypes.includes(currentDataType)) {
                    // is already set at a meaningful type
                    return;
                }
                let selectedDataType: RasterDataType = currentDataType ? currentDataType : outputDataTypes[0][0]; // use default
                if (rasterDataTypes.length) {
                    selectedDataType = rasterDataTypes[0];
                }
                setTimeout(() => {
                    dataTypeControl.setValue(selectedDataType);
                });
            }),
            map(([_rasterLayers, outputDataTypes]: [Array<RasterLayerMetadata>, Array<[RasterDataType, string]>]) => outputDataTypes),
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            setTimeout(() =>
                this.form.controls['rasterLayers'].updateValueAndValidity({
                    onlySelf: false,
                    emitEvent: true,
                }),
            );
        });
    }

    add(): void {
        if (this.loading$.value) {
            return; // don't add while loading
        }

        const name: string = this.form.controls['name'].value;
        const dataType: RasterDataType | undefined = this.form.controls['dataType'].value;
        const rasterLayers: Array<RasterLayer> | undefined = this.form.controls['rasterLayers'].value;

        if (!dataType || !rasterLayers) {
            return; // checked by form validator
        }

        // harmonize projection of all input layers
        const projectedOperators = this.projectService.getAutomaticallyProjectedOperatorsFromLayers(rasterLayers);

        // convert all input layers to the selected data type, if they are not already of that type
        const convertedOperators: Observable<Array<OperatorDict | SourceOperatorDict>> = projectedOperators.pipe(
            mergeMap((operators) =>
                of(
                    operators.map((operator, index) => {
                        const inputDataType = this.inputDataTypes[index];

                        if (inputDataType === dataType) {
                            return operator;
                        } else {
                            return {
                                type: 'RasterTypeConversion',
                                params: {
                                    outputDataType: dataType.getCode(),
                                },
                                sources: {
                                    raster: operator,
                                },
                            } as RasterTypeConversionDict as OperatorDict;
                        }
                    }),
                ),
            ),
        );

        this.loading$.next(true);

        convertedOperators
            .pipe(
                mergeMap((operators: Array<OperatorDict | SourceOperatorDict>) =>
                    this.projectService.registerWorkflow({
                        type: 'Raster',
                        operator: {
                            type: 'RasterStacker',
                            params: {},
                            sources: {
                                rasters: operators,
                            },
                        } as RasterStackerDict,
                    }),
                ),
                mergeMap((workflowId) =>
                    this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name,
                            symbology: rasterLayers[0].symbology.clone(),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe({
                next: () => {
                    this.loading$.next(false);
                },
                error: (error) => {
                    const errorMsg = error.error.message;

                    this.notificationService.error(errorMsg);
                    this.loading$.next(false);
                },
            });
    }
}
