import {HttpEventType} from '@angular/common/http';
import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Subject} from 'rxjs';
import {DataSetIdDict, UUID} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {DataSetService} from '../dataset.service';

interface ExampleLoadingInfo {
    name: string;
    json: string;
}

@Component({
    selector: 'wave-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit {
    selectedFiles: FileList;
    progress$ = new Subject<number>();
    indicateLoading$ = new Subject<boolean>();
    submittedUpload = false;
    submittedCreate = false;

    uploadId$: Subject<UUID> = new Subject();

    dataSetId$: Subject<DataSetIdDict> = new Subject();

    exampleLoadingInfos: Array<ExampleLoadingInfo> = [
        {
            name: 'NDVI',
            json: `{
                "properties": {
                    "id": null,
                    "name": "Uploaded NDVI",
                    "description": "NDVI data from MODIS",
                    "source_operator": "GdalSource"
                },
                "meta_data": {
                    "GdalMetaDataRegular": {
                        "result_descriptor": {
                            "data_type": "U8",
                            "spatial_reference": "EPSG:4326",
                            "measurement": "unitless"
                        },
                        "params": {
                            "file_path": "operators/test-data/raster/modis_ndvi/MOD13A2_M_NDVI_%%%_START_TIME_%%%.TIFF",
                            "rasterband_channel": 1,
                            "geo_transform": {
                                "origin_coordinate": {
                                    "x": -180.0,
                                    "y": 90.0
                                },
                                "x_pixel_size": 0.1,
                                "y_pixel_size": -0.1
                            },
                            "bbox": {
                                "lower_left_coordinate": {
                                    "x": -180.0,
                                    "y": -90.0
                                },
                                "upper_right_coordinate": {
                                    "x": 180.0,
                                    "y": 90.0
                                }
                            },
                            "file_not_found_handling": "NoData"
                        },
                        "placeholder": "%%%_START_TIME_%%%",
                        "time_format": "%Y-%m-%d",
                        "start": 1388534400000,
                        "step": {
                            "granularity": "Months",
                            "step": 1
                        }
                    }
                }
            }`,
        },
        {
            name: 'Ports',
            json: `{
                "properties": {
                    "id": null,
                    "name": "Uploaded Natural Earth 10m Ports",
                    "description": "Ports from Natural Earth",
                    "source_operator": "OgrSource"
                },
                "meta_data": {
                    "OgrMetaData": {
                        "loading_info": {
                            "file_name": "operators/test-data/vector/data/ne_10m_ports/ne_10m_ports.shp",
                            "layer_name": "ne_10m_ports",
                            "data_type": "MultiPoint",
                            "time": "none",
                            "columns": {
                                "x": "",
                                "y": null,
                                "numeric": [
                                    "natlscale"
                                ],
                                "decimal": [
                                    "scalerank"
                                ],
                                "textual": [
                                    "featurecla",
                                    "name",
                                    "website"
                                ]
                            },
                            "default_geometry": null,
                            "force_ogr_time_filter": false,
                            "on_error": "skip",
                            "provenance": null
                        },
                        "result_descriptor": {
                            "data_type": "MultiPoint",
                            "spatial_reference": "EPSG:4326",
                            "columns": {
                                "website": "Text",
                                "name": "Text",
                                "natlscale": "Number",
                                "scalerank": "Decimal",
                                "featurecla": "Text"
                            }
                        }
                    }
                }
            }`,
        },
    ];

    loadingInfo = '';

    constructor(protected dataSetService: DataSetService, protected notificationService: NotificationService) {}

    ngOnInit(): void {}

    selectFiles(event): void {
        this.selectedFiles = event.target.files;
    }

    upload(): void {
        const form = new FormData();

        for (const file of Array.from(this.selectedFiles)) {
            form.append('files[]', file, file.name);
        }

        this.submittedUpload = true;
        this.indicateLoading$.next(true);

        this.dataSetService.upload(form).subscribe(
            (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    this.progress$.next(Math.round((100 * event.loaded) / event.total));
                } else if (event.type === HttpEventType.Response) {
                    this.uploadId$.next(event.body.id);
                    this.indicateLoading$.next(false);
                }
            },
            (err) => {
                this.notificationService.error('File upload failed: ' + err);
                this.indicateLoading$.next(false);
            },
        );
    }

    selectLoadingInfo(info: ExampleLoadingInfo): void {
        this.loadingInfo = info.json;
    }

    submitLoadingInfo(uploadId: UUID): void {
        this.submittedCreate = true;
        this.indicateLoading$.next(true);

        const create = {
            upload: uploadId,
            definition: JSON.parse(this.loadingInfo),
        };

        this.dataSetService.createDataSet(create).subscribe(
            (id) => {
                this.dataSetId$.next(id);
                this.indicateLoading$.next(false);
            },
            (err) => {
                this.notificationService.error('Create dataset failed: ' + err);
                this.indicateLoading$.next(false);
            },
        );
    }
}
