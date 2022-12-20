import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {combineLatest, Observable, of, zip} from 'rxjs';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {
    LayerCollectionDict,
    LayerCollectionLayerDict,
    LayerDict,
    ProviderLayerIdDict,
    RasterResultDescriptorDict,
    RasterSymbologyDict,
    ResultDescriptorDict,
    SymbologyDict,
    UUID,
    VectorResultDescriptorDict,
    VectorSymbologyDict,
} from '../backend/backend.model';
import {LayerMetadata, RasterLayerMetadata, VectorLayerMetadata} from '../layers/layer-metadata.model';
import {ProjectService} from '../project/project.service';
import {NotificationService} from '../notification.service';
import {Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {
    ClusteredPointSymbology,
    LineSymbology,
    PointSymbology,
    PolygonSymbology,
    RasterSymbology,
    VectorSymbology,
} from '../layers/symbology/symbology.model';
import {colorToDict} from '../colors/color';
import {RandomColorService} from '../util/services/random-color.service';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionService {
    constructor(
        protected backend: BackendService,
        protected userService: UserService,
        protected projectService: ProjectService,
        protected notificationService: NotificationService,
        protected randomColorService: RandomColorService,
    ) {}

    getLayerCollectionItems(provider: UUID, collection: string, offset = 0, limit = 20): Observable<LayerCollectionDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionItems(session.sessionToken, provider, collection, offset, limit)));
    }

    getRootLayerCollectionItems(offset = 0, limit = 20): Observable<LayerCollectionDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getRootLayerCollectionItems(session.sessionToken, offset, limit)));
    }

    getLayer(provider: UUID, layer: string): Observable<LayerDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionLayer(session.sessionToken, provider, layer)));
    }

    registerAndGetLayerWorkflowId(providerId: UUID, layerId: string): Observable<UUID> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.registerWorkflowForLayer(session.sessionToken, providerId, layerId)));
    }

    getWorkflowIdMetadata(workflowId: UUID): Observable<VectorLayerMetadata | RasterLayerMetadata> {
        return this.getWorkflowIdMetadataDict(workflowId).pipe(map((workflowMetadataDict) => LayerMetadata.fromDict(workflowMetadataDict)));
    }

    getWorkflowIdMetadataDict(workflowId: UUID): Observable<ResultDescriptorDict> {
        return this.userService
            .getSessionStream()
            .pipe(mergeMap((session) => this.backend.getWorkflowMetadata(workflowId, session.sessionToken)));
    }

    /**
     * Add all layers (directly) contained in a layer collection to the current project.
     */
    addCollectionLayersToProject(collection: LayerCollectionDict): void {
        const layersObservable = collection.items
            .filter((layer) => layer.type === 'layer')
            .map((layer) => layer as LayerCollectionLayerDict)
            .map((layer) => this.resolveLayer(layer.id));

        // TODO: lookup in parallel
        zip(layersObservable)
            .pipe(map((layers) => this.projectService.addLayers(layers)))
            .subscribe();
    }

    /**
     * Add a layer to the current project.
     */
    addLayerToProject(layerId: ProviderLayerIdDict): void {
        this.resolveLayer(layerId).subscribe((layer: Layer) => {
            this.projectService.addLayer(layer);
        });
    }

    private resolveLayer(layerId: ProviderLayerIdDict): Observable<Layer> {
        return this.getLayer(layerId.providerId, layerId.layerId).pipe(
            mergeMap((layer: LayerDict) =>
                combineLatest([of(layer), this.registerAndGetLayerWorkflowId(layerId.providerId, layerId.layerId)]),
            ),
            mergeMap(([layer, workflowId]: [LayerDict, UUID]) =>
                combineLatest([of(layer), of(workflowId), this.projectService.getWorkflowMetaData(workflowId)]),
            ),
            map(([layer, workflowId, resultDescriptorDict]: [LayerDict, UUID, ResultDescriptorDict], _i) => {
                const keys = Object.keys(resultDescriptorDict);
                if (keys.includes('columns')) {
                    return new VectorLayer({
                        name: layer.name,
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology: layer.symbology
                            ? VectorSymbology.fromVectorSymbologyDict(layer.symbology as VectorSymbologyDict)
                            : this.createVectorSymbology((resultDescriptorDict as VectorResultDescriptorDict).dataType),
                    });
                } else if (keys.includes('measurement')) {
                    return new RasterLayer({
                        name: layer.name,
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology: layer.symbology
                            ? RasterSymbology.fromRasterSymbologyDict(layer.symbology as RasterSymbologyDict)
                            : RasterSymbology.fromRasterSymbologyDict({
                                  type: 'raster',
                                  opacity: 1.0,
                                  colorizer: {
                                      type: 'linearGradient',
                                      breakpoints: [
                                          {value: 1, color: [0, 0, 0, 255]},
                                          {value: 255, color: [255, 255, 255, 255]},
                                      ],
                                      defaultColor: [0, 0, 0, 0],
                                      noDataColor: [0, 0, 0, 0],
                                  },
                              }),
                    });
                } else {
                    // TODO: implement plots, etc.
                    throw new Error('Adding this workflow type is unimplemented, yet');
                }
            }),
        );
    }

    private doAddLayerToProject(layer: LayerDict, workflowId: UUID, resultDescriptorDict: ResultDescriptorDict): void {
        const keys = Object.keys(resultDescriptorDict);

        if (keys.includes('columns')) {
            this.addVectorLayer(layer.name, workflowId, resultDescriptorDict as VectorResultDescriptorDict, layer.symbology);
        } else if (keys.includes('measurement')) {
            this.addRasterLayer(layer.name, workflowId, resultDescriptorDict as RasterResultDescriptorDict, layer.symbology);
        } else {
            // TODO: implement plots, etc.
            this.notificationService.error('Adding this workflow type is unimplemented, yet');
        }
    }

    private addVectorLayer(
        layerName: string,
        workflowId: UUID,
        resultDescriptor: VectorResultDescriptorDict,
        symbology?: SymbologyDict,
    ): void {
        let vectorSymbology: VectorSymbology;
        if (symbology && symbology.type !== 'raster') {
            vectorSymbology = VectorSymbology.fromVectorSymbologyDict(symbology as VectorSymbologyDict);
        } else {
            vectorSymbology = this.createVectorSymbology(resultDescriptor.dataType);
        }

        const layer = new VectorLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: vectorSymbology,
        });

        this.projectService.addLayer(layer);
    }

    private createVectorSymbology(dataType: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'): VectorSymbology {
        switch (dataType) {
            case 'Data':
                // TODO: cope with that
                throw Error('we cannot add data layers here, yet');
            case 'MultiPoint':
                return ClusteredPointSymbology.fromPointSymbologyDict({
                    type: 'point',
                    radius: {type: 'static', value: PointSymbology.DEFAULT_POINT_RADIUS},
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
            case 'MultiLineString':
                return LineSymbology.fromLineSymbologyDict({
                    type: 'line',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                });
            case 'MultiPolygon':
                return PolygonSymbology.fromPolygonSymbologyDict({
                    type: 'polygon',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
        }
    }

    private addRasterLayer(
        layerName: string,
        workflowId: UUID,
        _resultDescriptor: RasterResultDescriptorDict,
        symbology?: SymbologyDict,
    ): void {
        let rasterSymbologyDict: RasterSymbologyDict;
        if (symbology && symbology.type === 'raster') {
            rasterSymbologyDict = symbology as RasterSymbologyDict;
        } else {
            rasterSymbologyDict = {
                type: 'raster',
                opacity: 1.0,
                colorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    defaultColor: [0, 0, 0, 0],
                    noDataColor: [0, 0, 0, 0],
                },
            };
        }

        const layer = new RasterLayer({
            name: layerName,
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: RasterSymbology.fromRasterSymbologyDict(rasterSymbologyDict),
        });

        this.projectService.addLayer(layer);
    }
}
