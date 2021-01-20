import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output, SimpleChange,
    SimpleChanges
} from '@angular/core';
import {Subscription} from 'rxjs';

import {Layer as OlLayer, Tile as OlLayerTile, Vector as OlLayerVector} from 'ol/layer';
import {Source as OlSource, Tile as OlTileSource, TileWMS as OlTileWmsSource, Vector as OlVectorSource} from 'ol/source';


import {StyleCreator} from './style-creator';
import {Layer, RasterLayer, VectorLayer} from '../layers/layer.model';
import {Config} from '../config.service';
import {ProjectService} from '../project/project.service';
import {LoadingState} from '../project/loading-state.model';
import {Time} from '../time/time.model';
import {SpatialReference} from '../operators/spatial-reference.model';
import {RasterData} from '../layers/layer-data.model';
import {BackendService} from '../backend/backend.service';
import {AbstractSymbology, MappingRasterSymbology, VectorSymbology} from '../layers/symbology/symbology.model';
import {UUID} from '../backend/backend.model';

type VectorData = any; // TODO: use correct type

/**
 * The `ol-layer` component represents a single layer object of open layers.
 */
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class MapLayerComponent<OL extends OlLayer, OS extends OlSource, L extends Layer> {

    @Input() layerId: number;
    @Input() isVisible: boolean;
    @Input() workflow: UUID;
    @Input() symbology: AbstractSymbology;

    /**
     * Event emitter that forces a redraw of the map.
     * Must be connected to the map component.
     */
    @Output() mapRedraw = new EventEmitter();

    protected source: OS;
    protected _mapLayer: OL;

    /**
     * Setup of DI
     */
    protected constructor(protected projectService: ProjectService) {
    }

    /**
     * Return the open layers layer element that displays our layer type
     */
    get mapLayer(): OL {
        return this._mapLayer;
    }

    /**
     * Return the extent of the layer in map units
     */
    abstract getExtent(): [number, number, number, number];

    protected extractChange<T>(change: SimpleChange): T | undefined {
        if (!change) {
            return undefined;
        }

        if (!change.isFirstChange() && change.currentValue === change.previousValue) {
            return undefined;
        }

        return change.currentValue;
    }
}

/**
 * This component reflects a vector layer on the map
 */
@Component({
    selector: 'wave-ol-vector-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlVectorLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlVectorLayerComponent extends MapLayerComponent<OlLayerVector, OlVectorSource, VectorLayer>
    implements OnInit, OnDestroy, OnChanges {

    symbology: VectorSymbology;

    protected dataSubscription: Subscription;

    constructor(protected projectService: ProjectService) {
        super(projectService);

        this.source = new OlVectorSource({wrapX: false});
        this._mapLayer = new OlLayerVector({
            source: this.source,
            updateWhileAnimating: true,
        });
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream({id: this.layerId}).subscribe((x: VectorData) => {
            this.source.clear(); // TODO: check if this is needed always...
            if (!(x === null || x === undefined)) {
                this.source.addFeatures(x.data);
            }
            this.updateOlLayer({symbology: this.symbology}); // FIXME: HACK until data is a part of a layer
        });
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    getExtent() {
        return this.source.getExtent();
    }

    private updateOlLayer(changes: {
        isVisible?: boolean,
        symbology?: VectorSymbology,
        workflow?: UUID,
    }) {
        if (changes.isVisible !== undefined) {
            this.mapLayer.setVisible(this.isVisible);
            this.mapRedraw.emit();
        }

        if (changes.symbology) {
            const style = StyleCreator.fromVectorSymbology(this.symbology);
            this.mapLayer.setStyle(style);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (Object.keys(changes).length > 0) {
            this.updateOlLayer({
                isVisible: this.extractChange<boolean>(changes.isVisible),
                symbology: this.extractChange<VectorSymbology>(changes.symbology),
                workflow: this.extractChange<UUID>(changes.workflow),
            });
        }
    }

}

/**
 * This component reflects a raster layer on the map
 */
@Component({
    selector: 'wave-ol-raster-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlRasterLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlRasterLayerComponent extends MapLayerComponent<OlLayerTile, OlTileSource, RasterLayer>
    implements OnInit, OnDestroy, OnChanges {

    symbology: MappingRasterSymbology;

    protected dataSubscription: Subscription;
    protected layerChangesSubscription: Subscription;
    protected timeSubscription: Subscription;

    protected projection: SpatialReference;
    protected time: Time;

    constructor(protected projectService: ProjectService,
                protected backend: BackendService,
                protected config: Config) {
        super(projectService);
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream({id: this.layerId}).subscribe((rasterData: RasterData) => {
            if (!rasterData) {
                return;
            }

            this.updateTime(rasterData.time);
            this.updateProjection(rasterData.spatialReference);

            if (!this.source) {
                this.initializeOrReplaceOlSource();
            }

            if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
                this.source.refresh();
            }

        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (Object.keys(changes).length > 0) {
            this.updateOlLayer({
                isVisible: this.extractChange<boolean>(changes.isVisible),
                symbology: this.extractChange<MappingRasterSymbology>(changes.symbology),
                workflow: this.extractChange<UUID>(changes.workflow),
            });
        }
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.layerChangesSubscription) {
            this.layerChangesSubscription.unsubscribe();
        }
        if (this.timeSubscription) {
            this.timeSubscription.unsubscribe();
        }
    }

    private updateOlLayer(changes: {
        isVisible?: boolean,
        symbology?: MappingRasterSymbology,
        workflow?: UUID,
    }) {
        if (this.source === undefined || this._mapLayer === undefined) {
            return;
        }

        if (changes.isVisible !== undefined) {
            this._mapLayer.setVisible(this.isVisible);
            this.mapRedraw.emit();
        }
        if (changes.symbology !== undefined) {
            this._mapLayer.setOpacity(this.symbology.opacity);
            this.source.updateParams({
                colors: this.symbology.mappingColorizerRequestString()
            });
        }
        if (changes.workflow !== undefined) {
            this.initializeOrReplaceOlSource();
        }

        if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
            this.source.refresh();
        }
    }

    private updateProjection(p: SpatialReference) {
        if (!this.projection || this.source.getProjection().getCode() !== this.projection.getCode()) {
            this.projection = p;
            this.updateOlLayerProjection();
        }
    }

    private updateOlLayerProjection() {
        // there is no way to change the projection of a layer. // TODO: check newer OL versions for this
        this.initializeOrReplaceOlSource();
    }

    private updateOlLayerTime() {
        if (this.source) {
            this.source.updateParams({
                time: this.time.asRequestString(),
                colors: this.symbology.mappingColorizerRequestString()
            });
        }
    }

    private updateTime(t: Time) {
        if (this.time === undefined || !t.isSame(this.time)) {
            this.time = t;
            this.updateOlLayerTime();
        }
    }

    private initializeOrReplaceOlSource() {
        this.source = new OlTileWmsSource({
            url: this.backend.wmsUrl,
            params: {
                layers: this.workflow,
                time: this.time.asRequestString(),
                // colors: this.layer.symbology.mappingColorizerRequestString()
            },
            projection: this.projection.getCode(),
            wrapX: false,
        });

        this.addStateListenersToOlSource();
        this.initializeOrUpdateOlMapLayer();
    }

    private initializeOrUpdateOlMapLayer() {
        if (this._mapLayer) {
            this._mapLayer.setSource(this.source);
        } else {
            this._mapLayer = new OlLayerTile({
                source: this.source,
                opacity: this.symbology.opacity,
            });
        }
    }

    private addStateListenersToOlSource() {
        // TILE LOADING STATE
        let tilesPending = 0;

        this.source.on('tileloadstart', () => {
            tilesPending++;
            this.projectService.changeRasterLayerDataStatus({id: this.layerId, layerType: 'raster'}, LoadingState.LOADING);
        });
        this.source.on('tileloadend', () => {
            tilesPending--;
            if (tilesPending <= 0) {
                this.projectService.changeRasterLayerDataStatus({id: this.layerId, layerType: 'raster'}, LoadingState.OK);
            }
        });
        this.source.on('tileloaderror', () => {
            tilesPending--;
            this.projectService.changeRasterLayerDataStatus({id: this.layerId, layerType: 'raster'}, LoadingState.ERROR);
        });
    }

    getExtent() {
        return this._mapLayer.getExtent();
    }
}
