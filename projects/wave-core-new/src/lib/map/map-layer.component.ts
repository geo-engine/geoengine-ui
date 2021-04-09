import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    SimpleChanges,
} from '@angular/core';
import {Subscription} from 'rxjs';

import {Layer as OlLayer, Tile as OlLayerTile, Vector as OlLayerVector} from 'ol/layer';
import {Source as OlSource, TileWMS as OlTileWmsSource, Vector as OlVectorSource} from 'ol/source';
import {Config} from '../config.service';
import {ProjectService} from '../project/project.service';
import {LoadingState} from '../project/loading-state.model';
import {Time} from '../time/time.model';
import {SpatialReference} from '../operators/spatial-reference.model';
import {RasterData} from '../layers/layer-data.model';
import {BackendService} from '../backend/backend.service';
import {UUID} from '../backend/backend.model';
import {RasterSymbology, Symbology, VectorSymbology} from '../layers/symbology/symbology.model';
import {Colorizer} from '../colors/colorizer.model';

type VectorData = any; // TODO: use correct type

/**
 * The `ol-layer` component represents a single layer object of open layers.
 */
@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export abstract class MapLayerComponent<OL extends OlLayer, OS extends OlSource> {
    @Input() layerId!: number;
    @Input() isVisible = true;
    @Input() workflow?: UUID;
    @Input() symbology?: Symbology;

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
    protected constructor(protected projectService: ProjectService, source: OS, layer: (_: OS) => OL) {
        this.source = source;
        this._mapLayer = layer(source);
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
export class OlVectorLayerComponent extends MapLayerComponent<OlLayerVector, OlVectorSource> implements OnInit, OnDestroy, OnChanges {
    symbology?: VectorSymbology;

    protected dataSubscription?: Subscription;

    constructor(protected projectService: ProjectService) {
        super(
            projectService,
            new OlVectorSource({wrapX: false}),
            (source) =>
                new OlLayerVector({
                    source,
                    updateWhileAnimating: true,
                }),
        );
    }

    ngOnInit(): void {
        this.dataSubscription = this.projectService.getLayerDataStream({id: this.layerId}).subscribe((x: VectorData) => {
            this.source.clear(); // TODO: check if this is needed always...
            if (!(x === null || x === undefined)) {
                this.source.addFeatures(x.data);
            }
            this.updateOlLayer({symbology: this.symbology}); // FIXME: HACK until data is a part of a layer
        });
    }

    ngOnDestroy(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    getExtent(): [number, number, number, number] {
        return this.source.getExtent();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (Object.keys(changes).length > 0) {
            this.updateOlLayer({
                isVisible: this.extractChange<boolean>(changes.isVisible),
                symbology: this.extractChange<VectorSymbology>(changes.symbology),
                workflow: this.extractChange<UUID>(changes.workflow),
            });
        }
    }

    private updateOlLayer(changes: {isVisible?: boolean; symbology?: VectorSymbology; workflow?: UUID}): void {
        if (changes.isVisible !== undefined) {
            this.mapLayer.setVisible(this.isVisible);
            this.mapRedraw.emit();
        }

        if (changes.symbology && this.symbology) {
            this.mapLayer.setStyle(this.symbology.createStyleFunction());
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
export class OlRasterLayerComponent extends MapLayerComponent<OlLayerTile, OlTileWmsSource> implements OnInit, OnDestroy, OnChanges {
    symbology?: RasterSymbology;

    protected dataSubscription?: Subscription;
    protected layerChangesSubscription?: Subscription;
    protected timeSubscription?: Subscription;

    protected spatialReference?: SpatialReference;
    protected time?: Time;

    constructor(protected projectService: ProjectService, protected backend: BackendService, protected config: Config) {
        super(
            projectService,
            new OlTileWmsSource({
                // empty for start
                params: {},
            }),
            (source) =>
                new OlLayerTile({
                    source,
                    opacity: 1,
                }),
        );
    }

    ngOnInit(): void {
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

    ngOnChanges(changes: SimpleChanges): void {
        if (Object.keys(changes).length > 0) {
            this.updateOlLayer({
                isVisible: this.extractChange<boolean>(changes.isVisible),
                symbology: this.extractChange<RasterSymbology>(changes.symbology),
                workflow: this.extractChange<UUID>(changes.workflow),
            });
        }
    }

    ngOnDestroy(): void {
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

    getExtent(): [number, number, number, number] {
        return this._mapLayer.getExtent() ?? [0, 0, 0, 0];
    }

    private updateOlLayer(changes: {isVisible?: boolean; symbology?: RasterSymbology; workflow?: UUID}): void {
        if (this.source === undefined || this._mapLayer === undefined) {
            return;
        }

        if (changes.isVisible !== undefined) {
            this._mapLayer.setVisible(this.isVisible);
            this.mapRedraw.emit();
        }
        if (changes.symbology && this.symbology) {
            this._mapLayer.setOpacity(this.symbology.opacity);
            this.source.updateParams({
                STYLES: this.stylesFromColorizer(this.symbology.colorizer),
            });
        }
        if (changes.workflow !== undefined) {
            this.initializeOrReplaceOlSource();
        }

        if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
            this.source.refresh();
        }
    }

    private updateProjection(p: SpatialReference): void {
        if (!this.spatialReference || this.source.getProjection().getCode() !== this.spatialReference.getCode()) {
            this.spatialReference = p;
            this.updateOlLayerProjection();
        }
    }

    private updateOlLayerProjection(): void {
        // there is no way to change the projection of a layer. // TODO: check newer OL versions for this
        this.initializeOrReplaceOlSource();
    }

    private updateOlLayerTime(): void {
        if (this.source && this.time && this.symbology) {
            this.source.updateParams({
                time: this.time.asRequestString(),
                STYLES: this.stylesFromColorizer(this.symbology.colorizer),
            });
        }
    }

    private updateTime(t: Time): void {
        if (this.time === undefined || !t.isSame(this.time)) {
            this.time = t;
            this.updateOlLayerTime();
        }
    }

    private initializeOrReplaceOlSource(): void {
        if (!this.time || !this.symbology || !this.spatialReference) {
            return;
        }

        this.source = new OlTileWmsSource({
            url: this.backend.wmsUrl,
            params: {
                layers: this.workflow,
                time: this.time.asRequestString(),
                STYLES: this.stylesFromColorizer(this.symbology.colorizer),
            },
            projection: this.spatialReference.getCode(),
            wrapX: false,
        });

        this.addStateListenersToOlSource();
        this.initializeOrUpdateOlMapLayer();
    }

    private stylesFromColorizer(colorizer: Colorizer): string {
        return 'custom:' + JSON.stringify(colorizer.toDict());
    }

    private initializeOrUpdateOlMapLayer(): void {
        if (this._mapLayer) {
            this._mapLayer.setSource(this.source);
        } else if (this.symbology) {
            this._mapLayer = new OlLayerTile({
                source: this.source,
                opacity: this.symbology.opacity,
            });
        }
    }

    private addStateListenersToOlSource(): void {
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
}
