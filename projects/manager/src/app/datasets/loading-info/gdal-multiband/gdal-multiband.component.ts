import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges, inject, input, viewChild} from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';
import {
    CommonModule,
    DatasetsService,
    TimeInterval,
    errorToText,
    time_interval_from_dict,
    time_interval_to_dict,
    extractSpatialPartition,
    ConfirmationComponent,
    geoengineValidators,
    spatialPartitionFromSpatialGridDefinition,
    spatialGridDefinitionFromSpatialPartitionAndGeoTransform,
} from '@geoengine/common';
import moment from 'moment';
import {
    DataPath,
    DatasetTile,
    GdalDatasetParameters,
    GdalMetaDataList,
    GdalMultiBand,
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
import {MatDivider, MatNavList, MatListItem, MatListItemTitle, MatListItemLine} from '@angular/material/list';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/autocomplete';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, concatMap, Observable, range, scan, startWith, Subject, filter, take, Subscription, firstValueFrom} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {RasterbandsComponent} from '../../../rasterbands/rasterbands.component';
import {AppConfig} from '../../../app-config.service';
import {MatDialog} from '@angular/material/dialog';
import {TimedescriptorComponent} from '../../../timedescriptor/timedescriptor.component';

export interface GdalMultiBandForm {
    // TODO: volume
    rasterResultDescriptor: FormGroup<RasterResultDescriptorForm>;
}

export interface TileForm {
    time: FormControl<TimeInterval>;
    bbox: FormGroup<BboxForm>;
    band: FormControl<number>;
    zIndex: FormControl<number>;
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
}

export interface BboxForm {
    bboxMinX: FormControl<number>;
    bboxMinY: FormControl<number>;
    bboxMaxX: FormControl<number>;
    bboxMaxY: FormControl<number>;
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

enum EditMode {
    Create,
    Created,
    Update,
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
        MatNavList,
        MatListItem,
        MatListItemTitle,
        MatListItemLine,
        CommonModule,
        GdalDatasetParametersComponent,
        RasterbandsComponent,
        TimedescriptorComponent,
    ],
})
export class GdalMultiBandComponent implements OnChanges {
    private readonly datasetsService = inject(DatasetsService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly config = inject(AppConfig);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly itemSizePx = 72;
    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    readonly viewport = viewChild.required(CdkVirtualScrollViewport);

    readonly dataPath = input<DataPath>();
    readonly metaData = input.required<GdalMultiBand>();
    readonly datasetName = input.required<string>();

    EditMode = EditMode;
    editMode = EditMode.Update;

    source?: TileDataSource;
    private sourceSubscription?: Subscription;

    RasterDataTypes = Object.values(RasterDataType);

    form: FormGroup<GdalMultiBandForm> = this.setUpForm();
    tileForm: FormGroup<TileForm> = this.setUpPlaceHolderTileForm();

    probeFileDatasetProperties = '';
    probeFileTileProperties = '';

    selectedTile?: DatasetTile;
    // hold only the selected tile id for stable identity comparison in the virtual scroll
    selectedTileId$ = new BehaviorSubject<string | undefined>(undefined);

    createdTileName?: string;
    createdTileId?: string;

    setUpSource(): void {
        this.source = new TileDataSource(this.datasetsService, this.datasetName());
        // calculate initial number of elements to display in `setTimeout` because the viewport is not yet initialized
        setTimeout(() => {
            this.source?.init(this.calculateInitialNumberOfElements());
        });

        // select the first tile in list
        this.sourceSubscription?.unsubscribe();
        if (this.source) {
            this.sourceSubscription = this.source
                .connect()
                .pipe(
                    filter((items) => items.length > 0),
                    take(1),
                )
                .subscribe((items) => {
                    if (items.length > 0) {
                        setTimeout(() => {
                            this.selectedTileId$.next(items[0].id);
                            this.tileForm = this.setUpTileForm(items[0]);
                            this.changeDetectorRef.markForCheck();
                        }, 0);
                    }
                });
        }
    }

    /**
     * Fetch new data when scrolled to the end of the list.
     */
    onScrolledIndexChange(_scrolledIndex: number): void {
        const end = this.viewport().getRenderedRange().end;
        const total = this.viewport().getDataLength();

        // only fetch when scrolled to the end
        if (end >= total) {
            this.source?.fetchMoreData(1);
        }
    }

    trackById(_index: number, item: DatasetTile): string {
        return item.id;
    }

    // return an array of indices for the raster bands to iterate over in the template
    get bandIndices(): number[] {
        const bands = this.form?.controls?.rasterResultDescriptor?.controls?.bands?.value ?? [];
        return Array.from({length: bands.length}, (_, i) => i);
    }

    async select(item: DatasetTile): Promise<void> {
        if (!item) {
            return;
        }

        if (this.tileForm.dirty) {
            const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
                data: {message: 'Do you really want to stop editing the tile? All changes will be lost.'},
            });

            const confirm = await firstValueFrom(confirmDialogRef.afterClosed());

            if (!confirm) {
                return;
            }
        }

        this.editMode = EditMode.Update;

        this.selectedTileId$.next(item.id);
        this.selectedTile = item;
        this.tileForm = this.setUpTileForm(item);
    }

    addTile(): void {
        this.editMode = EditMode.Create;
        this.tileForm = this.setUpPlaceHolderTileForm();
        this.selectedTileId$.next(undefined);
    }

    tileTitle(filePath: string): string {
        const lastSlash = filePath.lastIndexOf('/');
        const lastDot = filePath.lastIndexOf('.');
        const start = lastSlash === -1 ? 0 : lastSlash + 1;
        const end = lastDot === -1 || lastDot < start ? filePath.length : lastDot;
        return filePath.substring(start, end);
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/require-await
    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        const metaData = this.metaData();
        if (changes.metaData && metaData) {
            this.setUpFormFromResultDescriptor(metaData.resultDescriptor);
        }

        this.setUpSource();
    }

    async saveMetadata(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const metaData = this.getMetaData();

        try {
            await this.datasetsService.updateLoadingInfo(this.datasetName(), metaData);
            this.snackBar.open('Dataset loading information successfully updated.', 'Close', {
                duration: this.config.DEFAULTS.SNACKBAR_DURATION,
            });
            this.form.markAsPristine();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset loading information failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async saveTile(): Promise<void> {
        if (this.tileForm.invalid || !this.selectedTileId$.value) {
            return;
        }

        const tileId = this.selectedTileId$.value;
        const time = this.tileForm.controls.time.value;
        const bboxControls = this.tileForm.controls.bbox.controls;
        const spatialPartition = {
            lowerRightCoordinate: {
                x: bboxControls.bboxMaxX.value,
                y: bboxControls.bboxMinY.value,
            },
            upperLeftCoordinate: {
                x: bboxControls.bboxMinX.value,
                y: bboxControls.bboxMaxY.value,
            },
        };

        const params = this.getGdalParameters(this.tileForm.controls.gdalParameters);

        const update = {
            band: this.tileForm.controls.band.value,
            params,
            spatialPartition,
            time: {
                start: time.start.valueOf(),
                end: time.end.valueOf(),
            },
            zIndex: this.tileForm.controls.zIndex.value,
        };

        try {
            await this.datasetsService.updateDatasetTile(this.datasetName(), tileId, update);
            this.snackBar.open('Tile successfully saved.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.tileForm.markAsPristine();

            // update in source, s.t. selecting the tile again shows updated data
            if (this.selectedTile) {
                this.selectedTile.band = update.band;
                this.selectedTile.params = update.params;
                this.selectedTile.spatialPartition = spatialPartition;
                this.selectedTile.time = {
                    start: update.time.start,
                    end: update.time.end,
                };
                this.selectedTile.zIndex = update.zIndex;
            }
        } catch (error) {
            const errorMessage = await errorToText(error, 'Saving tile failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async deleteTile(): Promise<void> {
        if (!this.selectedTileId$.value) {
            return;
        }

        const dialogRef = this.dialog.open(ConfirmationComponent, {
            data: {message: 'Confirm the deletion of the tile. This cannot be undone.'},
        });

        const confirm = await firstValueFrom(dialogRef.afterClosed());

        if (!confirm) {
            return;
        }

        try {
            const tileId = this.selectedTileId$.value;
            await this.datasetsService.deleteDatasetTile(this.datasetName(), [tileId]);
            this.snackBar.open('Tile successfully deleted.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});

            this.setUpSource();
            this.changeDetectorRef.markForCheck();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Deleting tile failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async createTile(): Promise<void> {
        if (this.tileForm.invalid) {
            return;
        }

        const time = this.tileForm.controls.time.value;
        const bboxControls = this.tileForm.controls.bbox.controls;
        const spatialPartition = {
            lowerRightCoordinate: {
                x: bboxControls.bboxMaxX.value,
                y: bboxControls.bboxMinY.value,
            },
            upperLeftCoordinate: {
                x: bboxControls.bboxMinX.value,
                y: bboxControls.bboxMaxY.value,
            },
        };

        const params = this.getGdalParameters(this.tileForm.controls.gdalParameters);

        const add = {
            band: this.tileForm.controls.band.value,
            params,
            spatialPartition,
            time: {
                start: time.start.valueOf(),
                end: time.end.valueOf(),
            },
            zIndex: this.tileForm.controls.zIndex.value,
        };

        try {
            const tilesIds = await this.datasetsService.addDatasetTiles(this.datasetName(), [add]);
            this.createdTileId = tilesIds[0];
            this.createdTileName = this.tileTitle(params.filePath);
            this.editMode = EditMode.Created;

            this.snackBar.open('Tile successfully created.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            this.changeDetectorRef.markForCheck();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Creating tile failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    backToAllTiles(): void {
        this.setUpSource();
        this.editMode = EditMode.Update;
    }

    getResultDescriptor(form: FormGroup<RasterResultDescriptorForm>): RasterResultDescriptor {
        return {
            bands: form.controls.bands.value,
            spatialReference: form.controls.spatialReference.value,
            dataType: form.controls.dataType.value,
            spatialGrid: this.metaData().resultDescriptor.spatialGrid, // TODO: allow editing
            time: {
                bounds: null,
                dimension: {
                    type: 'irregular', // TODO: allow editing
                },
            },
        };
    }

    getGdalParameters(form: FormGroup<GdalDatasetParametersForm>): GdalDatasetParameters {
        return {
            allowAlphabandAsMask: form.controls.allowAlphabandAsMask.value,
            fileNotFoundHandling: form.controls.fileNotFoundHandling.value,
            filePath: form.controls.filePath.value,
            gdalConfigOptions: form.controls.gdalConfigOptions.value,
            gdalOpenOptions: form.controls.gdalOpenOptions.value,
            geoTransform: {
                originCoordinate: {
                    x: form.controls.geoTransform.controls.originCoordinate.controls.x.value,
                    y: form.controls.geoTransform.controls.originCoordinate.controls.y.value,
                },
                xPixelSize: form.controls.geoTransform.controls.xPixelSize.value,
                yPixelSize: form.controls.geoTransform.controls.yPixelSize.value,
            },
            height: form.controls.height.value,
            width: form.controls.width.value,
            noDataValue: form.controls.noDataValue.value,
            propertiesMapping: form.controls.propertiesMapping.controls.map((control) => {
                return {
                    sourceKey: {
                        domain: control.controls.sourceKey.controls.domain.value,
                        key: control.controls.sourceKey.controls.key.value,
                    },
                    targetKey: {
                        domain: control.controls.targetKey.controls.domain.value,
                        key: control.controls.targetKey.controls.key.value,
                    },
                    targetType: control.controls.targetType.value,
                };
            }),
            rasterbandChannel: form.controls.rasterbandChannel.value,
        };
    }

    getMetaData(): MetaDataDefinition {
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

        const resultDescriptor: RasterResultDescriptor = {
            bands: resultDescriptorControl.bands.value,
            spatialReference: resultDescriptorControl.spatialReference.value,
            dataType: resultDescriptorControl.dataType.value,
            spatialGrid: {
                descriptor: 'source',
                spatialGrid: spatialGridDefinitionFromSpatialPartitionAndGeoTransform(spatialPartition, geoTransform),
            },
            time: resultDescriptorControl.time.value,
        };

        return {
            type: 'GdalMultiBand',
            resultDescriptor,
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
            const [resultDescriptor, gdalParams] = extractedSuggestion;

            if (!gdalParams) {
                this.snackBar.open('No gdal parameters found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            this.setUpFormFromResultDescriptor(resultDescriptor);
            this.changeDetectorRef.markForCheck();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Metadata suggestion failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    async suggestTileProperties(): Promise<void> {
        const path = this.dataPath();
        if (!path) {
            this.snackBar.open('No data path selected.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            const suggestion = await this.datasetsService.suggestMetaData({
                suggestMetaData: {
                    dataPath: path,
                    mainFile: this.probeFileTileProperties,
                },
            });

            const extractedSuggestion = this.extractSuggestion(suggestion);
            if (!extractedSuggestion) {
                return;
            }
            const [_, gdalParams] = extractedSuggestion;

            if (!gdalParams) {
                this.snackBar.open('No gdal parameters found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            this.tileForm = this.setUpTileForm({
                band: this.tileForm.controls.gdalParameters.controls.rasterbandChannel.value,
                id: 'placeholder',
                spatialPartition: extractSpatialPartition(gdalParams),
                zIndex: 0,
                time: time_interval_to_dict(this.tileForm.controls.time.value),
                params: gdalParams,
            });
            this.changeDetectorRef.markForCheck();
        } catch (error) {
            const errorMessage = await errorToText(error, 'Metadata suggestion failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    protected calculateInitialNumberOfElements(): number {
        const element = this.viewport().elementRef.nativeElement;
        const numberOfElements = Math.ceil(element.clientHeight / this.itemSizePx);
        // add one such that scrolling happens
        return numberOfElements + 1;
    }

    private extractSuggestion(
        suggestion: MetaDataSuggestion,
    ): [RasterResultDescriptor, GdalDatasetParameters | null | undefined] | undefined {
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

    private setUpPlaceHolderTileForm(): FormGroup<TileForm> {
        return this.setUpTileForm({
            band: 0,
            id: 'placeholder',
            spatialPartition: {
                lowerRightCoordinate: {x: 0, y: 0},
                upperLeftCoordinate: {x: 0, y: 0},
            },
            zIndex: 0,
            time: time_interval_to_dict({
                start: moment.utc().startOf('day'),
                timeAsPoint: false,
                end: moment.utc().startOf('day').add(1, 'days'),
            }),
            params: GdalDatasetParametersComponent.placeHolderGdalParams(),
        });
    }

    private setUpTileForm(tile: DatasetTile): FormGroup<TileForm> {
        const form = new FormGroup<TileForm>({
            time: new FormControl(time_interval_from_dict(tile.time), {
                nonNullable: true,
                validators: [Validators.required],
            }),
            bbox: new FormGroup<BboxForm>({
                bboxMinX: new FormControl(tile.spatialPartition.upperLeftCoordinate.x, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                bboxMinY: new FormControl(tile.spatialPartition.lowerRightCoordinate.y, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                bboxMaxX: new FormControl(tile.spatialPartition.lowerRightCoordinate.x, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                bboxMaxY: new FormControl(tile.spatialPartition.upperLeftCoordinate.y, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            }),
            band: new FormControl(tile.band ?? 0, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            zIndex: new FormControl(tile.zIndex ?? 0, {
                nonNullable: true,
                validators: [Validators.required, geoengineValidators.largerThan(-1)],
            }),
            gdalParameters: GdalDatasetParametersComponent.setUpForm(tile.params),
        });

        return form;
    }
}

export const overlappingTimeIntervalsValidator =
    (): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const timeIntervalIntersects = (a: TimeInterval, b: TimeInterval): boolean => {
            // instants must be distinct
            if (a.start == a.end || b.start == b.end) {
                return a.start == b.start;
            }
            // touching intervals are not overlapping
            if (a.start == b.end || b.start == a.end) {
                return false;
            }
            // check if start of one interval is within the other
            return (a.start >= b.start && a.start < b.end) || (b.start >= a.start && b.start < a.end);
        };

        if (!(control instanceof FormArray)) {
            return null;
        }

        const formArray = control;

        const controls = formArray.controls;
        const values: TimeInterval[] = controls.map((c) => c.value.time);

        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) {
                if (timeIntervalIntersects(values[i], values[j])) {
                    return {overlappingTimeInterval: true};
                }
            }
        }

        return null;
    };

/**
 * A custom data source that allows fetching tiles for a virtual scroll source.
 */
class TileDataSource extends DataSource<DatasetTile> {
    // cannot increase this, since it is limited by the server
    readonly scrollFetchSize = 20;

    readonly loading$ = new BehaviorSubject(false);

    protected nextBatch$ = new Subject<number>();
    protected noMoreData = false;
    protected offset = 0;

    constructor(
        private datasetsService: DatasetsService,
        private datasetName: string,
    ) {
        super();
    }

    init(numberOfElements: number): void {
        this.fetchMoreData(Math.ceil(numberOfElements / this.scrollFetchSize)); // initially populate source
    }

    connect(): Observable<Array<DatasetTile>> {
        return this.nextBatch$.pipe(
            concatMap((numberOfTimes) => range(0, numberOfTimes)),
            concatMap(() => this.getMoreDataFromServer()),
            scan((acc, newValues) => [...acc, ...newValues]),
            startWith([]), // emit empty array initially to trigger loading animation properly
        );
    }

    /**
     * Clean up resources
     */
    disconnect(): void {
        // do nothing
    }

    fetchMoreData(numberOfTimes: number): void {
        if (this.noMoreData) {
            return;
        }
        this.nextBatch$.next(numberOfTimes);
    }

    protected async getMoreDataFromServer(): Promise<Array<DatasetTile>> {
        if (this.noMoreData) {
            return [];
        }

        this.loading$.next(true);

        const offset = this.offset;
        const limit = this.scrollFetchSize;

        return this.datasetsService.getDatasetTiles(this.datasetName, offset, limit).then((items) => {
            this.offset += items.length;

            if (items.length < limit) {
                this.noMoreData = true;
            }

            this.loading$.next(false);

            return items;
        });
    }
}
