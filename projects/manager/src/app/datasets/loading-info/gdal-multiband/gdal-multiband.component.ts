import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    inject,
    input,
    viewChild,
} from '@angular/core';
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
    GeoTransform,
    GridBoundingBox2D,
    GridIdx2D,
    TimeInterval,
    errorToText,
    BoundingBox2D,
    SpatialGridDefinition,
    SpatialGridDescriptor,
    time_interval_from_dict,
} from '@geoengine/common';
import moment from 'moment';
import {
    DataPath,
    DatasetTile,
    GdalDatasetParameters,
    GdalMetaDataList,
    GdalMultiBand,
    MetaDataDefinition,
    RasterBandDescriptor,
    RasterDataType,
    RasterResultDescriptor,
} from '@geoengine/openapi-client';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormField, MatLabel, MatInput, MatError} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatDivider, MatNavList, MatListItem, MatListItemTitle, MatListItemLine} from '@angular/material/list';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/autocomplete';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, concatMap, Observable, range, scan, startWith, Subject} from 'rxjs';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {RasterbandsComponent} from '../../../rasterbands/rasterbands.component';
import {AppConfig} from '../../../app-config.service';

export interface GdalMultiBandForm {
    rasterResultDescriptor: FormGroup<RasterResultDescriptorForm>;
}

export interface TileForm {
    time: FormControl<TimeInterval>;
    // TODO: bbox
    gdalParameters: FormGroup<GdalDatasetParametersForm>;
}

export interface RasterResultDescriptorForm {
    bands: FormControl<Array<RasterBandDescriptor>>;
    dataType: FormControl<RasterDataType>;
    spatialReference: FormControl<string>;
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
    ],
})
export class GdalMultiBandComponent implements OnChanges {
    private readonly datasetsService = inject(DatasetsService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly config = inject(AppConfig);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly itemSizePx = 72;
    readonly loadingSpinnerDiameterPx: number = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);

    readonly viewport = viewChild.required(CdkVirtualScrollViewport);

    source?: TileDataSource;

    RasterDataTypes = Object.values(RasterDataType);

    form: FormGroup<GdalMultiBandForm> = this.setUpForm();
    tileForm: FormGroup<TileForm> = this.setUpPlaceHolderTileForm();

    mainFile = '';

    @Input() dataPath?: DataPath; // TODO is not mandatory

    readonly metaData = input.required<GdalMultiBand>();
    readonly datasetName = input.required<string>();

    selectedTile = 0;
    selectedTile$ = new BehaviorSubject<DatasetTile | undefined>(undefined);

    setUpSource(): void {
        this.source = new TileDataSource(this.datasetsService, this.datasetName());
        // calculate initial number of elements to display in `setTimeout` because the viewport is not yet initialized
        setTimeout(() => {
            this.source?.init(this.calculateInitialNumberOfElements());
        });
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

    select(item: DatasetTile): void {
        this.selectedTile$.next(item);
        this.tileForm = this.setUpTileForm(
            time_interval_from_dict(item.time),
            item?.params ?? GdalDatasetParametersComponent.placeHolderGdalParams(),
        );
    }

    tileTitle(tile: DatasetTile) {
        const filePath = tile.params.filePath ?? '';
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
            this.setUpFormFromMetaData(metaData);
        }

        this.setUpSource();
    }

    async saveLoadingInfo(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        const metaData = this.getMetaData();

        try {
            await this.datasetsService.updateLoadingInfo(this.datasetName(), metaData);
            this.snackBar.open('Dataset loading information successfully updated.', 'Close', {
                duration: this.config.DEFAULTS.SNACKBAR_DURATION,
            });
        } catch (error) {
            const errorMessage = await errorToText(error, 'Updating dataset loading information failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    // addTimeSlicePlaceholder(): void {
    //     this.addTimeSlice(
    //         {
    //             start: moment.utc(),
    //             timeAsPoint: false,
    //             end: moment.utc().add(1, 'days'),
    //         },
    //         GdalDatasetParametersComponent.placeHolderGdalParams(),
    //         0,
    //     );
    // }

    // addTimeSlice(time: TimeInterval, gdalParams: GdalDatasetParameters, cacheTtl: number): void {
    //     this.form.controls.timeSlices.push(
    //         new FormGroup<TileForm>({
    //             time: new FormControl(time, {
    //                 nonNullable: true,
    //                 validators: [Validators.required],
    //             }),
    //             gdalParameters: GdalDatasetParametersComponent.setUpForm(gdalParams),
    //             cacheTtl: new FormControl<number>(cacheTtl, {
    //                 nonNullable: true,
    //                 validators: [Validators.required],
    //             }),
    //         }),
    //     );
    //     this.selectTimeSlice(this.form.controls.timeSlices.length - 1);
    // }

    // removeTimeSlice(): void {
    //     this.form.controls.timeSlices.removeAt(this.selectedTimeSlice);
    //     if (this.selectedTimeSlice >= this.form.controls.timeSlices.length) {
    //         this.selectedTimeSlice = this.form.controls.timeSlices.length - 1;
    //     }
    //     this.selectTimeSlice(this.selectedTimeSlice);
    // }

    // selectTimeSlice(index: number): void {
    //     this.selectedTimeSlice = index;
    //     this.changeDetectorRef.detectChanges();
    // }

    // getTime(i: number): string {
    //     const start = this.form.controls.timeSlices.at(i).controls.time.value.start.format('YYYY-MM-DD HH:mm');
    //     const end = this.form.controls.timeSlices.at(i).controls.time.value.end.format('YYYY-MM-DD HH:mm');
    //     return `${start} - ${end}`;
    // }

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

        const resultDescriptor: RasterResultDescriptor = {
            bands: resultDescriptorControl.bands.value,
            spatialReference: resultDescriptorControl.spatialReference.value,
            dataType: resultDescriptorControl.dataType.value,
            spatialGrid: this.metaData().resultDescriptor.spatialGrid, // TODO: allow editing
            time: {
                bounds: null,
                dimension: {
                    type: 'irregular', // TODO: allow editing
                },
            },
        };

        return {
            type: 'GdalMultiBand',
            resultDescriptor,
        };
    }

    async suggest(): Promise<void> {
        if (!this.dataPath) {
            this.snackBar.open('No data path selected.', 'Close', {panelClass: ['error-snackbar']});
            return;
        }

        try {
            const suggestion = await this.datasetsService.suggestMetaData({
                suggestMetaData: {
                    dataPath: this.dataPath,
                    mainFile: this.mainFile,
                },
            });

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

            if (!gdalParams) {
                this.snackBar.open('No gdal parameters found in metadata suggestion.', 'Close', {panelClass: ['error-snackbar']});
                return;
            }

            // if (this.form.controls.timeSlices.length === 0) {
            //     this.addTimeSlice(
            //         {
            //             start: moment.utc(),
            //             timeAsPoint: false,
            //             end: moment.utc().add(1, 'days'),
            //         },
            //         gdalParams,
            //         0,
            //     );
            // } else {
            //     this.form.controls.timeSlices
            //         .at(this.selectedTimeSlice)
            //         .setControl('gdalParameters', GdalDatasetParametersComponent.setUpForm(gdalParams));
            // }
            this.setResultDescriptor(gdalMetaDataList.resultDescriptor);
        } catch (error) {
            const errorMessage = await errorToText(error, 'Metadata suggestion failed.');
            this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
        }
    }

    setResultDescriptor(resultDescriptor: RasterResultDescriptor): void {
        this.form.controls.rasterResultDescriptor.controls.bands.setValue(resultDescriptor.bands);
        this.form.controls.rasterResultDescriptor.controls.dataType.setValue(resultDescriptor.dataType);
        this.form.controls.rasterResultDescriptor.controls.spatialReference.setValue(resultDescriptor.spatialReference);
    }

    protected calculateInitialNumberOfElements(): number {
        const element = this.viewport().elementRef.nativeElement;
        const numberOfElements = Math.ceil(element.clientHeight / this.itemSizePx);
        // add one such that scrolling happens
        return numberOfElements + 1;
    }

    private setUpFormFromMetaData(metaData: GdalMultiBand): void {
        this.form = new FormGroup<GdalMultiBandForm>({
            rasterResultDescriptor: new FormGroup<RasterResultDescriptorForm>({
                bands: new FormControl(metaData.resultDescriptor.bands, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                dataType: new FormControl(metaData.resultDescriptor.dataType, {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
                spatialReference: new FormControl(metaData.resultDescriptor.spatialReference, {
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
            }),
        });

        return form;
    }

    private setUpPlaceHolderTileForm(): FormGroup<TileForm> {
        return this.setUpTileForm(
            {
                start: moment.utc(),
                timeAsPoint: false,
                end: moment.utc().add(1, 'days'),
            },
            GdalDatasetParametersComponent.placeHolderGdalParams(),
        );
    }

    private setUpTileForm(time: TimeInterval, gdalParams: GdalDatasetParameters): FormGroup<TileForm> {
        const form = new FormGroup<TileForm>({
            time: new FormControl(time, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            gdalParameters: GdalDatasetParametersComponent.setUpForm(gdalParams),
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
