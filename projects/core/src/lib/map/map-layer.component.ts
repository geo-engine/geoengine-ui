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
import {Subject, Subscription} from 'rxjs';

import {Layer as OlLayer, Tile as OlLayerTile, Vector as OlLayerVector} from 'ol/layer';
import {ImageTile as OlImageTile} from 'ol';
import {Source as OlSource, TileWMS as OlTileWmsSource, Vector as OlVectorSource} from 'ol/source';
import {get as olGetProj} from 'ol/proj';
import {CoreConfig} from '../config.service';
import {ProjectService} from '../project/project.service';
import {LoadingState} from '../project/loading-state.model';
import {BackendService} from '../backend/backend.service';
import {UUID} from '../backend/backend.model';
import OlFeature from 'ol/Feature';
import TileState from 'ol/TileState';
import {Extent} from './map.service';
import {Projection} from 'ol/proj';
import {
    NotificationService,
    RasterColorizer,
    RasterData,
    RasterSymbology,
    SpatialReference,
    Symbology,
    Time,
    VectorSymbology,
    olExtentToTuple,
} from '@geoengine/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VectorData = any; // TODO: use correct type

/**
 * The `ol-layer` component represents a single layer object of open layers.
 */
@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix, @typescript-eslint/no-explicit-any
export abstract class MapLayerComponent<OL extends OlLayer<OS, any>, OS extends OlSource> {
    @Input() layerId!: number;
    @Input() isVisible = true;
    @Input() workflow?: UUID;
    @Input() symbology?: Symbology;

    /**
     * Event emitter that forces a redraw of the map.
     * Must be connected to the map component.
     */
    @Output() mapRedraw = new EventEmitter();

    loadedData$ = new Subject<void>();

    protected source: OS;
    protected _mapLayer: OL;

    /**
     * Setup of DI
     */
    protected constructor(
        protected projectService: ProjectService,
        source: OS,
        layer: (_: OS) => OL,
    ) {
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
    selector: 'geoengine-ol-vector-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlVectorLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class OlVectorLayerComponent
    extends MapLayerComponent<OlLayerVector<OlVectorSource<OlFeature>>, OlVectorSource<OlFeature>>
    implements OnInit, OnDestroy, OnChanges
{
    override symbology?: VectorSymbology;

    protected dataSubscription?: Subscription;

    constructor(protected override projectService: ProjectService) {
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
            this.loadedData$.next();
        });
    }

    ngOnDestroy(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    getExtent(): [number, number, number, number] {
        return olExtentToTuple(this.source.getExtent());
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
    selector: 'geoengine-ol-raster-layer',
    template: '',
    providers: [{provide: MapLayerComponent, useExisting: OlRasterLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class OlRasterLayerComponent
    extends MapLayerComponent<OlLayerTile<OlTileWmsSource>, OlTileWmsSource>
    implements OnInit, OnDestroy, OnChanges
{
    override symbology?: RasterSymbology;

    @Input() sessionToken?: UUID;

    protected dataSubscription?: Subscription;
    protected layerChangesSubscription?: Subscription;
    protected timeSubscription?: Subscription;

    protected spatialReference?: SpatialReference;
    protected time?: Time;

    constructor(
        protected override projectService: ProjectService,
        protected backend: BackendService,
        protected config: CoreConfig,
        protected notificationService: NotificationService,
    ) {
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
        return olExtentToTuple(this._mapLayer.getExtent() ?? [0, 0, 0, 0]);
    }

    private updateOlLayer(changes: {isVisible?: boolean; symbology?: RasterSymbology; workflow?: UUID; sessionToken?: UUID}): void {
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
                STYLES: this.stylesFromColorizer(this.symbology.rasterColorizer),
            });
        }
        if (changes.workflow !== undefined || changes.sessionToken !== undefined) {
            this.initializeOrReplaceOlSource();
        }

        if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
            this.source.refresh();
        }
    }

    private updateProjection(p: SpatialReference): void {
        if (!this.spatialReference || p.srsString !== this.spatialReference.srsString) {
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
                STYLES: this.stylesFromColorizer(this.symbology.rasterColorizer),
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
            url: `${this.backend.wmsBaseUrl}/${this.workflow}`,
            params: {
                layers: this.workflow,
                time: this.time.asRequestString(),
                STYLES: this.stylesFromColorizer(this.symbology.rasterColorizer),
                EXCEPTIONS: 'application/json',
            },
            projection: this.spatialReference.srsString,
            wrapX: false,
        });

        const proj = olGetProj(this.spatialReference.srsString) as Projection;
        const tileGrid = this.source.getTileGridForProjection(proj);

        this.source.setTileLoadFunction((olTile, src) => {
            const tile = olTile as OlImageTile;
            const tileCoord = tile.getTileCoord();
            const tileZoomLevel = tileCoord[0];
            const tileExtent = tileGrid.getTileCoordExtent(tileCoord) as Extent;

            const client = new XMLHttpRequest();

            const cancelSub = this.projectService
                .createQueryAbortStream(this.layerId, tileZoomLevel, tileExtent)
                .subscribe(() => client.abort());

            client.open('GET', src);
            client.responseType = 'blob';
            client.setRequestHeader('Authorization', `Bearer ${this.sessionToken}`);
            client.addEventListener('loadend', (_event) => {
                cancelSub.unsubscribe();
                const data = client.response;

                if (!data) {
                    tile.setState(TileState.ERROR);
                } else {
                    if (data.type === 'image/png') {
                        (tile.getImage() as HTMLImageElement).src = URL.createObjectURL(data);
                    } else {
                        tile.setState(TileState.ERROR);
                        data.text().then((m: string) => this.notificationService.error(JSON.parse(m)['message']));
                    }
                }
            });
            client.addEventListener('error', () => {
                tile.setState(TileState.ERROR);
            });
            client.send();
        });

        this.addStateListenersToOlSource();
        this.initializeOrUpdateOlMapLayer();
    }

    private stylesFromColorizer(colorizer: RasterColorizer): string {
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
