import {HttpEventType} from '@angular/common/http';
import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, Subject} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {DataSetIdDict, UUID} from '../../backend/backend.model';
import {NotificationService} from '../../notification.service';
import {ProjectService} from '../../project/project.service';
import {DataSetService} from '../dataset.service';

interface ExampleLoadingInfo {
    name: string;
    json: string;
}

enum State {
    Start = 1,
    Uploading = 2,
    Uploaded = 3,
    Creating = 4,
    Created = 5,
}

@Component({
    selector: 'wave-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit {
    readonly State = State;

    state$ = new BehaviorSubject<State>(State.Start);
    uploadId$ = new Subject<UUID>();
    dataSetId$ = new Subject<DataSetIdDict>();
    progress$ = new Subject<number>();

    simpleCreateForm: FormGroup;
    selectedFiles: FileList;
    selectedMainFile: string;
    loadingInfo = '';

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

    constructor(
        protected dataSetService: DataSetService,
        protected notificationService: NotificationService,
        protected projectService: ProjectService,
    ) {
        this.simpleCreateForm = new FormGroup({
            name: new FormControl('', Validators.required),
            description: new FormControl(''),
            mainFile: new FormControl('', Validators.required),
        });
    }

    ngOnInit(): void {}

    selectFiles(event): void {
        this.selectedFiles = event.target.files;
    }

    upload(): void {
        const form = new FormData();

        for (const file of Array.from(this.selectedFiles)) {
            form.append('files[]', file, file.name);
        }

        this.state$.next(State.Uploading);

        this.dataSetService.upload(form).subscribe(
            (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    this.progress$.next(Math.round((100 * event.loaded) / event.total));
                } else if (event.type === HttpEventType.Response) {
                    this.uploadId$.next(event.body.id);
                    this.state$.next(State.Uploaded);
                }
            },
            (err) => {
                this.notificationService.error('File upload failed: ' + err.message);
                this.state$.next(State.Start);
            },
        );
    }

    selectLoadingInfo(info: ExampleLoadingInfo): void {
        this.loadingInfo = info.json;
    }

    submitLoadingInfo(uploadId: UUID): void {
        this.state$.next(State.Creating);

        const create = {
            upload: uploadId,
            definition: JSON.parse(this.loadingInfo),
        };

        this.dataSetService.createDataSet(create).subscribe(
            (response) => {
                this.dataSetId$.next(response.id);
                this.state$.next(State.Created);
            },
            (err) => {
                this.notificationService.error('Create dataset failed: ' + err.message);
                this.state$.next(State.Uploaded);
            },
        );
    }

    submitAutoCreate(uploadId: UUID): void {
        this.state$.next(State.Creating);

        const create = {
            upload: uploadId,
            dataset_name: this.simpleCreateForm.controls['name'].value,
            dataset_description: this.simpleCreateForm.controls['description'].value,
            main_file: this.selectedMainFile,
        };

        this.dataSetService.autoCreateDataSet(create).subscribe(
            (response) => {
                this.dataSetId$.next(response.id);
                this.state$.next(State.Created);
            },
            (err) => {
                this.notificationService.error('Create dataset failed: ' + err.message);
                this.state$.next(State.Uploaded);
            },
        );
    }

    addToMap(datasetId: DataSetIdDict): void {
        this.dataSetService
            .getDataset(datasetId)
            .pipe(mergeMap((dataset) => this.dataSetService.addDataSetToMap(dataset)))
            .subscribe();
    }
}
