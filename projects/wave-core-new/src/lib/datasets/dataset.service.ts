import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {Dataset, VectorResultDescriptor} from './dataset.model';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {HttpEvent} from '@angular/common/http';
import {AutoCreateDatasetDict, CreateDatasetDict, DatasetIdDict, DatasetIdResponseDict, UploadResponseDict} from '../backend/backend.model';
import {RandomColorService} from '../util/services/random-color.service';
import {RasterLayer, VectorLayer} from '../layers/layer.model';
import {LineSymbology, PointSymbology, PolygonSymbology, RasterSymbology, VectorSymbology} from '../layers/symbology/symbology.model';
import {VectorDataTypes} from '../operators/datatype.model';
import {colorToDict} from '../colors/color';
import {ProjectService} from '../project/project.service';

@Injectable({
    providedIn: 'root',
})
export class DatasetService {
    constructor(
        protected backend: BackendService,
        protected userService: UserService,
        protected projectService: ProjectService,
        protected randomColorService: RandomColorService,
    ) {}

    getDatasets(): Observable<Array<Dataset>> {
        return this.userService.getSessionStream().pipe(
            mergeMap((session) => this.backend.getDatasets(session.sessionToken)),
            map((datasetDicts) => datasetDicts.map((dict) => Dataset.fromDict(dict))),
        );
    }

    getDataset(id: DatasetIdDict): Observable<Dataset> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((token) => this.backend.getDataset(token, id)),
            map((dict) => Dataset.fromDict(dict)),
        );
    }

    upload(form: FormData): Observable<HttpEvent<UploadResponseDict>> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.upload(token, form)));
    }

    createDataset(create: CreateDatasetDict): Observable<DatasetIdResponseDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.createDataset(token, create)));
    }

    autoCreateDataset(create: AutoCreateDatasetDict): Observable<DatasetIdResponseDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.autoCreateDataset(token, create)));
    }

    addDatasetToMap(dataset: Dataset): Observable<void> {
        const workflow = dataset.createSourceWorkflow();

        return this.projectService.registerWorkflow(workflow).pipe(
            mergeMap((workflowId) => {
                if (dataset.result_descriptor.getTypeString() === 'Raster') {
                    return this.projectService.addLayer(
                        new RasterLayer({
                            workflowId,
                            name: dataset.name,
                            symbology: RasterSymbology.fromRasterSymbologyDict({
                                opacity: 1.0,
                                colorizer: {
                                    LinearGradient: {
                                        breakpoints: [
                                            {value: 1, color: [0, 0, 0, 255]},
                                            {value: 255, color: [255, 255, 255, 255]},
                                        ],
                                        default_color: [0, 0, 0, 0],
                                        no_data_color: [0, 0, 0, 0],
                                    },
                                },
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    );
                } else {
                    const resultDescriptor = dataset.result_descriptor as VectorResultDescriptor;

                    let symbology: VectorSymbology;

                    switch (resultDescriptor.data_type) {
                        case VectorDataTypes.MultiPoint:
                            symbology = PointSymbology.fromPointSymbologyDict({
                                radius: {Static: 10},
                                stroke: {
                                    width: {Static: 1},
                                    color: {Static: [0, 0, 0, 255]},
                                },
                                fill_color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                            });
                            break;
                        case VectorDataTypes.MultiLineString:
                            symbology = LineSymbology.fromLineSymbologyDict({
                                stroke: {
                                    width: {Static: 1},
                                    color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                                },
                            });
                            break;
                        case VectorDataTypes.MultiPolygon:
                            symbology = PolygonSymbology.fromPolygonSymbologyDict({
                                stroke: {width: {Static: 1}, color: {Static: [0, 0, 0, 255]}},
                                fill_color: {Static: colorToDict(this.randomColorService.getRandomColorRgba())},
                            });
                            break;
                        default:
                            throw Error('unknown symbology type');
                    }

                    return this.projectService.addLayer(
                        new VectorLayer({
                            workflowId,
                            name: dataset.name,
                            symbology,
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    );
                }
            }),
        );
    }
}
