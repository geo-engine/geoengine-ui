import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {Dataset, VectorResultDescriptor} from './dataset.model';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {HttpEvent} from '@angular/common/http';
import {
    AutoCreateDatasetDict,
    CreateDatasetDict,
    DatasetNameResponseDict,
    DataSetProviderListingDict,
    MetaDataSuggestionDict,
    SuggestMetaDataDict,
    UploadFileLayersResponseDict,
    UploadFilesResponseDict,
    UploadResponseDict,
    UUID,
    WorkflowDict,
} from '../backend/backend.model';
import {RandomColorService} from '../util/services/random-color.service';
import {Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {
    ClusteredPointSymbology,
    LineSymbology,
    PointSymbology,
    PolygonSymbology,
    RasterSymbology,
    VectorSymbology,
} from '../layers/symbology/symbology.model';
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

    getDatasets(offset = 0, limit = 20): Observable<Array<Dataset>> {
        return this.userService.getSessionStream().pipe(
            mergeMap((session) => this.backend.getDatasets(session.sessionToken, offset, limit)),
            map((datasetDicts) => datasetDicts.map((dict) => Dataset.fromDict(dict))),
        );
    }

    getDatasetProviders(): Observable<Array<DataSetProviderListingDict>> {
        return this.userService.getSessionStream().pipe(mergeMap((session) => this.backend.getDatasetProviders(session.sessionToken)));
    }

    getDataset(name: string): Observable<Dataset> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((token) => this.backend.getDataset(token, name)),
            map((dict) => Dataset.fromDict(dict)),
        );
    }
    upload(form: FormData): Observable<HttpEvent<UploadResponseDict>> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.upload(token, form)));
    }

    getUploadFiles(uploadId: UUID): Observable<UploadFilesResponseDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.getUploadFiles(token, uploadId)));
    }

    getUploadFileLayers(uploadId: UUID, fileName: string): Observable<UploadFileLayersResponseDict> {
        return this.userService
            .getSessionTokenForRequest()
            .pipe(mergeMap((token) => this.backend.getUploadFileLayers(token, uploadId, fileName)));
    }

    createDataset(create: CreateDatasetDict): Observable<DatasetNameResponseDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.createDataset(token, create)));
    }

    autoCreateDataset(create: AutoCreateDatasetDict): Observable<DatasetNameResponseDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.autoCreateDataset(token, create)));
    }

    suggestMetaData(suggest: SuggestMetaDataDict): Observable<MetaDataSuggestionDict> {
        return this.userService.getSessionTokenForRequest().pipe(mergeMap((token) => this.backend.suggestMetaData(token, suggest)));
    }

    addDatasetToMap(dataset: Dataset): Observable<void> {
        const workflow = dataset.createSourceWorkflow();
        return this.addDatasetToMapWithSourceWorkflow(dataset, workflow);
    }

    addDatasetToMapWithSourceWorkflow(dataset: Dataset, workflow: WorkflowDict): Observable<void> {
        return this.createLayerFromDatasetWithWorkflow(dataset, workflow).pipe(mergeMap((layer) => this.projectService.addLayer(layer)));
    }

    createLayerFromDataset(dataset: Dataset): Observable<Layer> {
        const workflow = dataset.createSourceWorkflow();
        return this.createLayerFromDatasetWithWorkflow(dataset, workflow);
    }

    createLayerFromDatasetWithWorkflow(dataset: Dataset, workflow: WorkflowDict): Observable<Layer> {
        return this.projectService.registerWorkflow(workflow).pipe(map((workflowId) => this.createLayer(workflowId, dataset)));
    }

    createLayer(workflowId: string, dataset: Dataset): Layer {
        if (dataset.resultDescriptor.getTypeString() === 'Raster') {
            const symbology = dataset.symbology as RasterSymbology;
            return new RasterLayer({
                workflowId,
                name: dataset.displayName,
                symbology: symbology
                    ? symbology
                    : RasterSymbology.fromRasterSymbologyDict({
                          type: 'raster',
                          opacity: 1.0,
                          colorizer: {
                              type: 'linearGradient',
                              breakpoints: [
                                  {value: 1, color: [0, 0, 0, 255]},
                                  {value: 255, color: [255, 255, 255, 255]},
                              ],
                              overColor: [255, 255, 255, 127],
                              underColor: [0, 0, 0, 127],
                              noDataColor: [0, 0, 0, 0],
                          },
                      }),
                isLegendVisible: false,
                isVisible: true,
            });
        } else {
            const resultDescriptor = dataset.resultDescriptor as VectorResultDescriptor;

            let symbology: VectorSymbology;

            switch (resultDescriptor.dataType) {
                case VectorDataTypes.MultiPoint:
                    symbology = (dataset.symbology as PointSymbology)
                        ? (dataset.symbology as PointSymbology)
                        : ClusteredPointSymbology.fromPointSymbologyDict({
                              type: 'point',
                              radius: {
                                  type: 'static',
                                  value: PointSymbology.DEFAULT_POINT_RADIUS,
                              },
                              stroke: {
                                  width: {
                                      type: 'static',
                                      value: 1,
                                  },
                                  color: {
                                      type: 'static',
                                      color: [0, 0, 0, 255],
                                  },
                              },
                              fillColor: {
                                  type: 'static',
                                  color: colorToDict(this.randomColorService.getRandomColorRgba()),
                              },
                          });
                    break;
                case VectorDataTypes.MultiLineString:
                    symbology = (dataset.symbology as LineSymbology)
                        ? (dataset.symbology as LineSymbology)
                        : LineSymbology.fromLineSymbologyDict({
                              type: 'line',
                              stroke: {
                                  width: {type: 'static', value: 1},
                                  color: {
                                      type: 'static',
                                      color: colorToDict(this.randomColorService.getRandomColorRgba()),
                                  },
                              },
                              autoSimplified: true,
                          });
                    break;
                case VectorDataTypes.MultiPolygon:
                    symbology = (dataset.symbology as PolygonSymbology)
                        ? (dataset.symbology as PolygonSymbology)
                        : PolygonSymbology.fromPolygonSymbologyDict({
                              type: 'polygon',
                              stroke: {
                                  width: {
                                      type: 'static',
                                      value: 1,
                                  },
                                  color: {
                                      type: 'static',
                                      color: [0, 0, 0, 255],
                                  },
                              },
                              fillColor: {
                                  type: 'static',
                                  color: colorToDict(this.randomColorService.getRandomColorRgba()),
                              },
                              autoSimplified: true,
                          });
                    break;
                default:
                    throw Error('unknown symbology type');
            }

            return new VectorLayer({
                workflowId,
                name: dataset.displayName,
                symbology,
                isLegendVisible: false,
                isVisible: true,
            });
        }
    }
}
