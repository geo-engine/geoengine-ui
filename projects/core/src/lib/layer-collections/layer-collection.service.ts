import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {combineLatest, firstValueFrom, Observable, of, ReplaySubject, zip} from 'rxjs';
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
import {RasterSymbology, VectorSymbology} from '../layers/symbology/symbology.model';
import {RandomColorService} from '../util/services/random-color.service';
import {subscribeAndProvide} from '../util/conversions';
import {createVectorSymbology} from '../util/symbologies';
import {
    AutocompleteHandlerRequest,
    LayerCollection,
    LayersApi,
    ProviderCapabilities,
    SearchHandlerRequest,
} from '@geoengine/openapi-client';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionService {
    layersApi = new ReplaySubject<LayersApi>(1);

    constructor(
        protected backend: BackendService,
        protected userService: UserService,
        protected projectService: ProjectService,
        protected notificationService: NotificationService,
        protected randomColorService: RandomColorService,
    ) {
        this.userService.getSessionStream().subscribe({
            next: (session) => this.layersApi.next(new LayersApi(session.apiConfiguration)),
        });
    }

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
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((session) => this.backend.registerWorkflowForLayer(session, providerId, layerId)),
            map((workflowIdDict) => workflowIdDict.id as UUID),
        );
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

    /**
     * Fetches the capabilities of a layer provider.
     */
    async capabilities(providerId: UUID, options?: {abortController?: AbortController}): Promise<ProviderCapabilities> {
        const layersApi = await firstValueFrom(this.layersApi);

        return await layersApi.providerCapabilitiesHandler(
            {provider: providerId},
            {
                signal: options?.abortController?.signal,
            },
        );
    }

    /**
     * Searches a layer collection with autocomplete.
     *
     * @returns an array of matching layer (collection) names
     *
     * Returns an empty array…
     * - on success, when no results are found
     * - on error, e.g., when autocomplete is not supported by the backend
     * - on abort, e.g., when `options.abortController` is aborted
     */
    async autocompleteSearch(request: AutocompleteHandlerRequest, options?: {abortController?: AbortController}): Promise<Array<string>> {
        const layersApi = await firstValueFrom(this.layersApi);
        return await layersApi
            .autocompleteHandler(request, {
                signal: options?.abortController?.signal,
            })
            // on error or abort, just return an empty result
            .catch(() => []);
    }

    /**
     * Searches a layer collection.
     *
     * @returns a virtual layer collection of matching layers and layer collections
     */
    async search(request: SearchHandlerRequest, options?: {abortController?: AbortController}): Promise<LayerCollection> {
        const layersApi = await firstValueFrom(this.layersApi);
        return await layersApi.searchHandler(request, {
            signal: options?.abortController?.signal,
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
                            : createVectorSymbology(
                                  (resultDescriptorDict as VectorResultDescriptorDict).dataType,
                                  this.randomColorService.getRandomColorRgba(),
                              ),
                    });
                } else if (keys.includes('bands')) {
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
                                  rasterColorizer: {
                                      type: 'singleBand',
                                      band: 0,
                                      bandColorizer: {
                                          type: 'linearGradient',
                                          breakpoints: [
                                              {value: 1, color: [0, 0, 0, 255]},
                                              {value: 255, color: [255, 255, 255, 255]},
                                          ],
                                          overColor: [255, 255, 255, 127],
                                          underColor: [0, 0, 0, 127],
                                          noDataColor: [0, 0, 0, 0],
                                      },
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
}
