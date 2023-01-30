import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {combineLatest, Observable, of, zip} from 'rxjs';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {
    LayerCollectionDict,
    LayerCollectionItemDict,
    LayerCollectionLayerDict,
    LayerDict,
    ProviderLayerIdDict,
    RasterSymbologyDict,
    ResultDescriptorDict,
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
import {subscribeAndProvide} from '../util/conversions';

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
            .getSessionTokenForRequest()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionItems(session, provider, collection, offset, limit)));
    }

    getRootLayerCollectionItems(offset = 0, limit = 20): Observable<LayerCollectionDict> {
        return this.userService
            .getSessionTokenForRequest()
            .pipe(mergeMap((session) => this.backend.getRootLayerCollectionItems(session, offset, limit)));
    }

    getLayer(provider: UUID, layer: string): Observable<LayerDict> {
        return this.userService
            .getSessionTokenForRequest()
            .pipe(mergeMap((session) => this.backend.getLayerCollectionLayer(session, provider, layer)));
    }

    registerAndGetLayerWorkflowId(providerId: UUID, layerId: string): Observable<UUID> {
        return this.userService
            .getSessionTokenForRequest()
            .pipe(mergeMap((session) => this.backend.registerWorkflowForLayer(session, providerId, layerId)));
    }

    getWorkflowIdMetadata(workflowId: UUID): Observable<VectorLayerMetadata | RasterLayerMetadata> {
        return this.getWorkflowIdMetadataDict(workflowId).pipe(map((workflowMetadataDict) => LayerMetadata.fromDict(workflowMetadataDict)));
    }

    getWorkflowIdMetadataDict(workflowId: UUID): Observable<ResultDescriptorDict> {
        return this.userService
            .getSessionTokenForRequest()
            .pipe(mergeMap((session) => this.backend.getWorkflowMetadata(workflowId, session)));
    }

    /**
     * Add all layers (directly) contained in a layer collection to the current project.
     */
    addCollectionLayersToProject(collectionItems: Array<LayerCollectionItemDict>): Observable<void> {
        const layersObservable = collectionItems
            .filter((layer) => layer.type === 'layer')
            .map((layer) => layer as LayerCollectionLayerDict)
            .map((layer) => this.resolveLayer(layer.id));

        // TODO: lookup in parallel
        return subscribeAndProvide(zip(layersObservable).pipe(mergeMap((layers) => this.projectService.addLayers(layers))));
    }

    /**
     * Add a layer to the current project.
     */
    addLayerToProject(layerId: ProviderLayerIdDict): Observable<void> {
        return subscribeAndProvide(this.resolveLayer(layerId).pipe(mergeMap((layer: Layer) => this.projectService.addLayer(layer))));
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
                                      overColor: [255, 255, 255, 127],
                                      underColor: [0, 0, 0, 127],
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
}
