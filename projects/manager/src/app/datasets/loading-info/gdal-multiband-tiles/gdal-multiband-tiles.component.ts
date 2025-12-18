import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges, inject, input, viewChild} from '@angular/core';
import {FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {GdalDatasetParametersComponent, GdalDatasetParametersForm} from '../gdal-dataset-parameters/gdal-dataset-parameters.component';
import {
    CommonModule,
    DatasetsService,
    TimeInterval,
    TimeIntervalInputComponent,
    errorToText,
    time_interval_from_dict,
    time_interval_to_dict,
    extractSpatialPartition,
    ConfirmationComponent,
    geoengineValidators,
} from '@geoengine/common';
import moment from 'moment';
import {DataPath, DatasetTile, GdalDatasetParameters, MetaDataSuggestion, RasterBandDescriptor} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormField, MatLabel, MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatDivider, MatNavList, MatListItem, MatListItemTitle, MatListItemLine} from '@angular/material/list';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, concatMap, Observable, range, scan, startWith, Subject, Subscription, firstValueFrom} from 'rxjs';
import {CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf} from '@angular/cdk/scrolling';
import {AppConfig} from '../../../app-config.service';
import {MatDialog} from '@angular/material/dialog';

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

enum EditMode {
    Create,
    Created,
    Update,
}

@Component({
    selector: 'geoengine-manager-gdal-multiband-tiles',
    templateUrl: './gdal-multiband-tiles.component.html',
    styleUrl: './gdal-multiband-tiles.component.scss',
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
        MatIcon,
        MatNavList,
        MatListItem,
        MatListItemTitle,
        MatListItemLine,
        CommonModule,
        GdalDatasetParametersComponent,
        TimeIntervalInputComponent,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        MatProgressSpinner,
    ],
})
export class GdalMultiBandTilesComponent implements OnChanges {
    private readonly datasetsService = inject(DatasetsService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly config = inject(AppConfig);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly itemSizePx = 72;
    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    readonly viewport = viewChild.required(CdkVirtualScrollViewport);

    readonly dataPath = input<DataPath>();
    readonly datasetName = input.required<string>();
    readonly bands = input.required<Array<RasterBandDescriptor>>();

    EditMode = EditMode;
    editMode = EditMode.Update;

    source?: TileDataSource;
    private sourceSubscription?: Subscription;

    tileForm: FormGroup<TileForm> = this.setUpPlaceHolderTileForm();

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
            this.sourceSubscription = this.source.connect().subscribe((items) => {
                if (items.length > 0) {
                    setTimeout(() => {
                        this.editMode = EditMode.Update;
                        this.selectedTileId$.next(items[0].id);
                        this.tileForm = this.setUpTileForm(items[0]);
                        this.changeDetectorRef.markForCheck();
                    }, 0);
                } else {
                    setTimeout(() => {
                        this.editMode = EditMode.Create;
                        this.selectedTileId$.next(undefined);
                        this.tileForm = this.setUpPlaceHolderTileForm();
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
        const bands = this.bands() ?? [];
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

            const confirm = (await firstValueFrom(confirmDialogRef.afterClosed())) as boolean;

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

    ngOnChanges(_changes: SimpleChanges): void {
        this.setUpSource();
        this.tileForm = this.setUpPlaceHolderTileForm();
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

        const confirm = (await firstValueFrom(dialogRef.afterClosed())) as boolean;

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

            const gdalParams = this.extractGdalParamsFromSuggestion(suggestion);
            if (!gdalParams) {
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

    private extractGdalParamsFromSuggestion(suggestion: MetaDataSuggestion): GdalDatasetParameters | undefined {
        // TODO: replace with a proper API for suggestion once old GdalSource is removed form the backend
        if (suggestion.metaData.type !== 'GdalMetaDataList') {
            this.snackBar.open(`Metadata suggestion is not of type "GdalMetaDataList" but ${suggestion.metaData.type}`, 'Close', {
                panelClass: ['error-snackbar'],
            });
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        const gdalMetaDataList = suggestion.metaData as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const slices = gdalMetaDataList.params;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (slices.length === 0) {
            this.snackBar.open('No time slices found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const firstSlice = slices[0];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const gdalParams = firstSlice.params;

        if (!gdalParams) {
            this.snackBar.open('No gdal parameters found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return gdalParams;
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
