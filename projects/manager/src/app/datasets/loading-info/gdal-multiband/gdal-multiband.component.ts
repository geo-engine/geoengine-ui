import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges, inject, input, output} from '@angular/core';
import {FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    CommonModule,
    DatasetsService,
    errorToText,
    spatialPartitionFromSpatialGridDefinition,
    spatialGridDefinitionFromSpatialPartitionAndGeoTransform,
} from '@geoengine/common';
import {
    DataPath,
    GdalMetaDataList,
    MetaDataDefinition,
    MetaDataSuggestion,
    RasterBandDescriptor,
    RasterDataType,
    RasterResultDescriptor,
    SpatialPartition2D,
    GeoTransform as GeoTransformDict,
    TimeDescriptor,
} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormField, MatLabel, MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/list';
import {MatSelect, MatOption} from '@angular/material/select';
import {RasterbandsComponent} from '../../../rasterbands/rasterbands.component';
import {AppConfig} from '../../../app-config.service';
import {TimedescriptorComponent} from '../../../timedescriptor/timedescriptor.component';

export interface GdalMultiBandForm {
    rasterResultDescriptor: FormGroup<RasterResultDescriptorForm>;
}

export interface RasterResultDescriptorForm {
    bands: FormControl<Array<RasterBandDescriptor>>;
    time: FormControl<TimeDescriptor>;
    dataType: FormControl<RasterDataType>;
    spatialReference: FormControl<string>;
    spatialGrid: FormGroup<SpatialGridDescriptorForm>;
}

export interface SpatialGridDescriptorForm {
    geoTransform: FormGroup<GeoTransformForm>;
    gridBounds: FormGroup<GridBoundingBox2DForm>;
}

export interface GeoTransformForm {
    originX: FormControl<number>;
    originY: FormControl<number>;
    xPixelSize: FormControl<number>;
    yPixelSize: FormControl<number>;
}

export interface GridBoundingBox2DForm {
    minX: FormControl<number>;
    minY: FormControl<number>;
    maxX: FormControl<number>;
    maxY: FormControl<number>;
}

@Component({
    selector: 'geoengine-manager-gdal-multiband',
    templateUrl: './gdal-multiband.component.html',
    styleUrl: './gdal-multiband.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatButton,
        MatDivider,
        MatSelect,
        MatOption,
        CommonModule,
        RasterbandsComponent,
        TimedescriptorComponent,
    ],
})
export class GdalMultiBandComponent implements OnChanges {
    private readonly datasetsService = inject(DatasetsService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly config = inject(AppConfig);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly dataPath = input<DataPath>();
    readonly resultDescriptor = input<RasterResultDescriptor>();
    readonly datasetName = input<string>();

    readonly resultDescriptorChange = output<RasterResultDescriptor>();

    RasterDataTypes = Object.values(RasterDataType);

    form: FormGroup<GdalMultiBandForm> = this.setUpForm();

    probeFileDatasetProperties = '';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.resultDescriptor) {
            const resultDescriptor = this.resultDescriptor();
            if (resultDescriptor) {
                this.setUpFormFromResultDescriptor(resultDescriptor);
            }
        }
    }

    async saveMetadata(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const datasetName = this.datasetName();
        if (!datasetName) {
            this.snackBar.open('No dataset name provided.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        const metaData = this.getMetaData();

        try {
            await this.datasetsService.updateLoadingInfo(datasetName, metaData);
            this.snackBar.open('Dataset loading information successfully updated.', 'Close', {
                duration: this.config.DEFAULTS.SNACKBAR_DURATION,
            });
            this.form.markAsPristine();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset loading information failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    getResultDescriptor(): RasterResultDescriptor {
        const resultDescriptorControl = this.form.controls.rasterResultDescriptor.controls;

        const geoTransformControl = resultDescriptorControl.spatialGrid.controls.geoTransform.controls;
        const geoTransform: GeoTransformDict = {
            originCoordinate: {
                x: geoTransformControl.originX.value,
                y: geoTransformControl.originY.value,
            },
            xPixelSize: geoTransformControl.xPixelSize.value,
            yPixelSize: geoTransformControl.yPixelSize.value,
        };

        const spatialGridControl = resultDescriptorControl.spatialGrid.controls.gridBounds.controls;
        const spatialPartition: SpatialPartition2D = {
            upperLeftCoordinate: {
                x: spatialGridControl.minX.value,
                y: spatialGridControl.maxY.value,
            },
            lowerRightCoordinate: {
                x: spatialGridControl.maxX.value,
                y: spatialGridControl.minY.value,
            },
        };

        return {
            bands: resultDescriptorControl.bands.value,
            spatialReference: resultDescriptorControl.spatialReference.value,
            dataType: resultDescriptorControl.dataType.value,
            spatialGrid: {
                descriptor: 'source',
                spatialGrid: spatialGridDefinitionFromSpatialPartitionAndGeoTransform(spatialPartition, geoTransform),
            },
            time: resultDescriptorControl.time.value,
        };
    }

    getMetaData(): MetaDataDefinition {
        return {
            type: 'GdalMultiBand',
            resultDescriptor: this.getResultDescriptor(),
        };
    }

    async suggestDatasetProperties(): Promise<void> {
        const path = this.dataPath();
        if (!path) {
            this.snackBar.open('No data path selected.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            const suggestion = await this.datasetsService.suggestMetaData({
                suggestMetaData: {
                    dataPath: path,
                    mainFile: this.probeFileDatasetProperties,
                },
            });

            const extractedSuggestion = this.extractSuggestion(suggestion);
            if (!extractedSuggestion) {
                return;
            }
            const [resultDescriptor, _gdalParams] = extractedSuggestion;

            this.setUpFormFromResultDescriptor(resultDescriptor);
            this.changeDetectorRef.markForCheck();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Metadata suggestion failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    private extractSuggestion(suggestion: MetaDataSuggestion): [RasterResultDescriptor, unknown] | undefined {
        // TODO: replace with a proper API for suggestion once old GdalSource is removed form the backend
        if (suggestion.metaData.type !== 'GdalMetaDataList') {
            this.snackBar.open(`Metadata suggestion is not of type "GdalMetaDataList" but ${suggestion.metaData.type}`, 'Close', {
                panelClass: ['error-snackbar'],
            });
            return;
        }

        const gdalMetaDataList = suggestion.metaData as GdalMetaDataList;
        const slices = gdalMetaDataList.params;

        if (slices.length === 0) {
            this.snackBar.open('No time slices found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        const firstSlice = slices[0];
        const gdalParams = firstSlice.params;
        return [gdalMetaDataList.resultDescriptor, gdalParams];
    }

    private setUpFormFromResultDescriptor(resultDescriptor: RasterResultDescriptor): void {
        const spatialPartition = spatialPartitionFromSpatialGridDefinition(resultDescriptor.spatialGrid.spatialGrid);

        this.form = new FormGroup<GdalMultiBandForm>({
            rasterResultDescriptor: new FormGroup<RasterResultDescriptorForm>({
                bands: new FormControl(resultDescriptor.bands, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                dataType: new FormControl(resultDescriptor.dataType, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialReference: new FormControl(resultDescriptor.spatialReference, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialGrid: new FormGroup<SpatialGridDescriptorForm>({
                    geoTransform: new FormGroup<GeoTransformForm>({
                        originX: new FormControl(resultDescriptor.spatialGrid.spatialGrid.geoTransform.originCoordinate.x, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        originY: new FormControl(resultDescriptor.spatialGrid.spatialGrid.geoTransform.originCoordinate.y, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        xPixelSize: new FormControl(resultDescriptor.spatialGrid.spatialGrid.geoTransform.xPixelSize, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        yPixelSize: new FormControl(resultDescriptor.spatialGrid.spatialGrid.geoTransform.yPixelSize, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    }),
                    gridBounds: new FormGroup<GridBoundingBox2DForm>({
                        minX: new FormControl(spatialPartition.upperLeftCoordinate.x, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        minY: new FormControl(spatialPartition.lowerRightCoordinate.y, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        maxX: new FormControl(spatialPartition.lowerRightCoordinate.x, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        maxY: new FormControl(spatialPartition.upperLeftCoordinate.y, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    }),
                }),
                time: new FormControl(resultDescriptor.time, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
        });

        this.form.markAsPristine();

        // Emit changes when form is updated
        this.form.valueChanges.subscribe(() => {
            if (this.form.valid) {
                this.resultDescriptorChange.emit(this.getResultDescriptor());
            }
        });
    }

    private setUpForm(): FormGroup<GdalMultiBandForm> {
        const form = new FormGroup<GdalMultiBandForm>({
            rasterResultDescriptor: new FormGroup<RasterResultDescriptorForm>({
                bands: new FormControl(
                    [
                        {
                            name: 'band',
                            measurement: {type: 'unitless'},
                        },
                    ],
                    {
                        nonNullable: true,
                        validators: [Validators.required],
                    },
                ),
                dataType: new FormControl(RasterDataType.U8, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialReference: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialGrid: new FormGroup<SpatialGridDescriptorForm>({
                    geoTransform: new FormGroup<GeoTransformForm>({
                        originX: new FormControl(0, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        originY: new FormControl(0, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        xPixelSize: new FormControl(1, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        yPixelSize: new FormControl(-1, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    }),
                    gridBounds: new FormGroup<GridBoundingBox2DForm>({
                        minX: new FormControl(0, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        minY: new FormControl(0, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        maxX: new FormControl(1, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                        maxY: new FormControl(1, {
                            nonNullable: true,
                            validators: [Validators.required],
                        }),
                    }),
                }),
                time: new FormControl(
                    {dimension: {type: 'irregular'}, bounds: null},
                    {
                        nonNullable: true,
                        validators: [Validators.required],
                    },
                ),
            }),
        });

        return form;
    }
}
