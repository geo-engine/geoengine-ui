import {ChangeDetectionStrategy, Component, Directive, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
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

type VectorData = any; // TODO: use correct type
type LayerChanges = any; // TODO: use correct type

/**
 * The `ol-layer` component represents a single layer object of open layers.
 */
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class MapLayerComponent<OL extends OlLayer, OS extends OlSource, L extends Layer> {

    /**
     * A raster or vector layer
     */
    @Input() layer: L;

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
}

/**
 * The vector layer abstraction for a map layer
 */
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class OlVectorLayerComponent extends MapLayerComponent<OlLayerVector, OlVectorSource, VectorLayer>
    implements OnInit, OnDestroy {
    private dataSubscription: Subscription;
    private layerChangesSubscription: Subscription;

    protected constructor(protected projectService: ProjectService) {
        super(projectService);
        this.source = new OlVectorSource({wrapX: false});
        this._mapLayer = new OlLayerVector({
            source: this.source,
            updateWhileAnimating: true,
        });
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((x: VectorData) => {
            this.source.clear(); // TODO: check if this is needed always...
            if (!(x === null || x === undefined)) {
                this.source.addFeatures(x.data);
            }
            this.updateOlLayer({symbology: this.layer.symbology}); // FIXME: HACK until data is a part of a layer
        });

        this.layerChangesSubscription = this.projectService.getLayerChangesStream(this.layer)
            .subscribe((changes: LayerChanges) => {
                this.updateOlLayer(changes);
            });
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.layerChangesSubscription) {
            this.layerChangesSubscription.unsubscribe();
        }
    }

    getExtent() {
        return this.source.getExtent();
    }

    private updateOlLayer(changes: LayerChanges) {
        if (changes.visible !== undefined) {
            this.mapLayer.setVisible(this.layer.isVisible);
            this.mapRedraw.emit();
        }

        if (changes.symbology) {
            const style = StyleCreator.fromVectorSymbology(this.layer.symbology);
            this.mapLayer.setStyle(style);
        }
    }
}

/**
 * This component reflects a point layer on the map
 */
@Component({
    selector: 'wave-ol-point-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlPointLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPointLayerComponent extends OlVectorLayerComponent implements OnInit, OnDestroy {
    constructor(protected projectService: ProjectService) {
        super(projectService);
    }
}

/**
 * This component reflects a point line on the map
 */
@Component({
    selector: 'wave-ol-line-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlLineLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlLineLayerComponent extends OlVectorLayerComponent implements OnInit, OnDestroy {
    constructor(protected projectService: ProjectService) {
        super(projectService);
    }
}

/**
 * This component reflects a polygon layer on the map
 */
@Component({
    selector: 'wave-ol-polygon-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlPolygonLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPolygonLayerComponent extends OlVectorLayerComponent implements OnInit, OnDestroy {
    constructor(protected projectService: ProjectService) {
        super(projectService);
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
export class OlRasterLayerComponent extends MapLayerComponent<OlLayerTile, OlTileSource, RasterLayer> implements OnInit, OnDestroy {

    private dataSubscription: Subscription;
    private layerChangesSubscription: Subscription;
    private timeSubscription: Subscription;

    private projection: SpatialReference;
    private time: Time;

    constructor(protected projectService: ProjectService,
                protected backend: BackendService,
                protected config: Config) {
        super(projectService);
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((rasterData: RasterData) => {
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

        this.layerChangesSubscription = this.projectService.getLayerChangesStream(this.layer)
            .subscribe((changes: LayerChanges) => {
                this.updateOlLayer(changes);
                if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
                    this.source.refresh();
                }
            });
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

    private updateOlLayer(changes: LayerChanges) {
        if (this.source === undefined || this._mapLayer === undefined) {
            return;
        }

        if (changes.visible !== undefined) {
            this._mapLayer.setVisible(this.layer.isVisible);
            this.mapRedraw.emit();
        }
        if (changes.symbology !== undefined) {
            this._mapLayer.setOpacity(this.layer.symbology.opacity);
            this.source.updateParams({
                colors: this.layer.symbology.mappingColorizerRequestString()
            });
        }
        if (changes.operator !== undefined) {
            this.initializeOrReplaceOlSource();
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
                colors: this.layer.symbology.mappingColorizerRequestString()
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
                layers: this.layer.workflowId,
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
                opacity: this.layer.symbology.opacity,
            });
        }
    }

    private addStateListenersToOlSource() {
        // TILE LOADING STATE
        let tilesPending = 0;

        this.source.on('tileloadstart', () => {
            tilesPending++;
            this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.LOADING);
        });
        this.source.on('tileloadend', () => {
            tilesPending--;
            if (tilesPending <= 0) {
                this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.OK);
            }
        });
        this.source.on('tileloaderror', () => {
            tilesPending--;
            this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.ERROR);
        });
    }

    getExtent() {
        return this._mapLayer.getExtent();
    }
}
