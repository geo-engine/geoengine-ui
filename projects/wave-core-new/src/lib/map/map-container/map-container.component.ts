import {combineLatest, Observable, Subscription} from 'rxjs';
import {first, map as rxMap, mergeMap, startWith} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    QueryList,
    SimpleChange,
    ViewChild,
    ViewChildren,
} from '@angular/core';

import OlMap from 'ol/Map';
import OlView from 'ol/View';
import {FeatureLike as OlFeatureLike} from 'ol/Feature';
import OlFeature from 'ol/Feature';

import OlLayerImage from 'ol/layer/Image';
import OlLayer from 'ol/layer/Layer';
import OlLayerTile from 'ol/layer/Tile';
import OlLayerVector from 'ol/layer/Vector';

import OlSource from 'ol/source/Source';
import OlSourceOSM from 'ol/source/OSM';
import OlTileWmsSource from 'ol/source/TileWMS';
import OlSourceVector from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import OlImageStatic from 'ol/source/ImageStatic';

import OlGeometryType from 'ol/geom/GeometryType';
import OlGeomPoint from 'ol/geom/Point';
import OlFormatGeoJSON from 'ol/format/GeoJSON';

import OlStyleFill from 'ol/style/Fill';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle, {StyleLike as OlStyleLike} from 'ol/style/Style';

import OlInteractionDraw from 'ol/interaction/Draw';
import OlInteractionSelect from 'ol/interaction/Select';
import {SelectEvent as OlSelectEvent} from 'ol/interaction/Select';
import OlGeometry from 'ol/geom/Geometry';

import {MapLayerComponent} from '../map-layer.component';

import {SpatialReference} from '../../spatial-references/spatial-reference.model';
import {FeatureSelection, ProjectService} from '../../project/project.service';
import {Extent, MapService} from '../map.service';
import {Config} from '../../config.service';
import {LayoutService} from '../../layout.service';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';
import {VectorSymbology} from '../../layers/symbology/symbology.model';
import {SpatialReferenceService, WEB_MERCATOR} from '../../spatial-references/spatial-reference.service';
import {containsCoordinate, getCenter} from 'ol/extent';
import {olExtentToTuple} from '../../util/conversions';

type MapLayer = MapLayerComponent<OlLayer<OlSource, any>, OlSource>;

const DEFAULT_ZOOM_LEVEL = 2;
const MIN_ZOOM_LEVEL = 0;
const MAX_ZOOM_LEVEL = 28;

/**
 * The `wave-map-container` component encapsulates openLayers maps.
 * It displays `wave-map-layer` components as child components, i.e., either layers on a single map or a grid of maps.
 */
@Component({
    selector: 'wave-map-container',
    templateUrl: 'map-container.component.html',
    styleUrls: ['map-container.component.scss'],
    queries: {
        contentChildren: new ContentChildren(MapLayerComponent),
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapContainerComponent implements AfterViewInit, OnChanges, OnDestroy {
    /**
     * display a grid of maps or all layers on a single map
     */
    @Input() grid = true; // TODO: false;

    @ViewChild(MatGridList, {read: ElementRef, static: true}) gridListElement!: ElementRef;
    @ViewChildren(MatGridTile, {read: ElementRef}) mapContainers!: QueryList<ElementRef>;

    /**
     * These are the layers from the layer list (as dom elements in the template)
     */
    @ContentChildren(MapLayerComponent) mapLayersRaw!: QueryList<MapLayer>;
    mapLayers: Array<MapLayer> = []; // filtered

    numberOfRows = 1;
    numberOfColumns = 1;
    rowHeight = 'fit';

    private projection$: Observable<SpatialReference> = this.projectService.getSpatialReferenceStream();

    private maps: Array<OlMap>;
    private view: OlView;
    private backgroundLayerSource?: OlSource;
    private backgroundLayers: Array<OlLayer<OlSource, any>> = [];

    private selectedOlLayer?: OlLayer<OlSource, any> = undefined;
    private userSelect?: OlInteractionSelect;

    private selectedFeature?: OlFeature<OlGeometry> = undefined;
    private selectedFeatureOriginalStyle?: OlStyleLike = undefined;

    private drawInteractionSource?: OlSourceVector<OlGeometry>;
    private drawType: string = OlGeometryType.POINT;
    private drawInteractions: Array<OlInteractionDraw> = [];
    private drawInteractionLayers: Array<OlLayerVector<OlSourceVector<OlGeometry>>> = [];

    private subscriptions: Array<Subscription> = [];

    /**
     * Create the component and inject several dependencies via DI.
     */
    constructor(
        private config: Config,
        private changeDetectorRef: ChangeDetectorRef,
        private mapService: MapService,
        // private layerService: LayerService,
        private layoutService: LayoutService,
        private projectService: ProjectService,
        private spatialReferenceService: SpatialReferenceService,
    ) {
        // set dummy maps so that they are not uninitialized
        this.view = new OlView({
            zoom: DEFAULT_ZOOM_LEVEL,
        });
        this.maps = [
            new OlMap({
                view: this.view,
            }),
        ];
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    ngAfterViewInit(): void {
        this.projection$.pipe(first()).subscribe((projection) => {
            this.maps.forEach((map) => map.setTarget(undefined)); // initially reset all DOM bindings

            this.initOpenlayersMap(projection);

            // since all viewports are linked and there will always be the first map, we link the event only to map 0
            this.maps[0].on('moveend', (_event) => this.emitViewportSize());

            this.initUserSelect();

            this.subscriptions.push(
                combineLatest([(this.mapLayersRaw.changes as Observable<MapLayer>).pipe(startWith({})), this.projection$])
                    .pipe(rxMap(([_changes, newProjection]) => newProjection))
                    .subscribe((newProjection: SpatialReference) => {
                        this.redrawLayers(newProjection);
                    }),
            );
        });

        this.subscriptions.push(
            this.mapLayersRaw.changes
                .pipe(mergeMap((layers: Array<MapLayer>) => combineLatest(layers.map((l) => l.loadedData$))))
                .subscribe(() => {
                    this.resetSelection();
                    this.performSelection(this.projectService.getSelectedFeature());
                }),
        );
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}): void {
        for (const propName in changes) {
            if (propName === 'grid') {
                this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection));
            }
        }
    }

    /**
     * Notify the map that the container has resized.
     */
    resize(): void {
        setTimeout(() => this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection)));
    }

    /**
     * Increases the zoom level if it is not larger than the maximum zoom level
     */
    zoomIn(): void {
        const zoomLevel = this.view.getZoom();
        if (zoomLevel && zoomLevel < MAX_ZOOM_LEVEL) {
            this.view.adjustZoom(1);
        }
    }

    /**
     * Decreases the zoom level if it is not smaller than the minimum zoom level
     */
    zoomOut(): void {
        const zoomLevel = this.view.getZoom();
        if (zoomLevel && zoomLevel > MIN_ZOOM_LEVEL) {
            this.view.adjustZoom(-1);
        }
    }

    /**
     * Zoom to and focus a bounding box
     */
    zoomTo(boundingBox: Extent): void {
        this.view.fit(boundingBox, {
            nearest: true,
            maxZoom: MAX_ZOOM_LEVEL,
        });
    }

    /**
     * Enable user input (hand drawn) for the map
     */
    public startDrawInteraction(drawType: string): void {
        if (this.isDrawInteractionAttached()) {
            throw new Error('only one draw interaction can be active!');
        }

        this.drawType = drawType;
        this.drawInteractionSource = new OlSourceVector({wrapX: false});

        this.reattachDrawInteractions();
    }

    /**
     * Indicator if the map currently has a source for user input (hand drawn)
     */
    public isDrawInteractionAttached(): boolean {
        return !!this.drawInteractionSource;
    }

    /**
     * Disable user input (hand drawn) for the map and return the result
     */
    public endDrawInteraction(): OlSourceVector<OlGeometry> | undefined {
        if (!this.isDrawInteractionAttached()) {
            console.error('no interaction or layer active!');
            return undefined;
        }

        const source = this.drawInteractionSource;

        this.drawInteractionSource = undefined;

        this.reattachDrawInteractions();

        return source;
    }

    /**
     * Force a redraw for each map layer
     */
    public layerForcesRedraw(): void {
        this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection));
    }

    private createDrawInteractionLayer(): OlLayerVector<OlSourceVector<OlGeometry>> {
        return new OlLayerVector({
            source: this.drawInteractionSource,
        });
    }

    private createDrawInteraction(): OlInteractionDraw {
        return new OlInteractionDraw({
            source: this.drawInteractionSource,
            type: this.drawType,
        });
    }

    private reattachDrawInteractions(): void {
        // remove layers
        this.drawInteractionLayers.forEach((layer, index) => {
            if (index < this.maps.length) {
                this.maps[index].removeLayer(layer);
            }
            layer.setMap(undefined as any);
        });
        this.drawInteractionLayers.length = 0;

        // remove interactions
        this.drawInteractions.forEach((interaction, index) => {
            if (index < this.maps.length) {
                this.maps[index].removeInteraction(interaction);
            }
            interaction.setMap(undefined as any);
        });
        this.drawInteractions.length = 0;

        // reattach
        if (this.isDrawInteractionAttached()) {
            this.maps.forEach((map) => {
                const drawInteractionLayer = this.createDrawInteractionLayer();
                this.drawInteractionLayers.push(drawInteractionLayer);
                map.addLayer(drawInteractionLayer);

                const drawInteraction = this.createDrawInteraction();
                this.drawInteractions.push(drawInteraction);
                map.addInteraction(drawInteraction);
            });
        }
    }

    private calculateGrid(): void {
        const numberOfLayers = this.desiredNumberOfMaps();

        const containerWidth = this.gridListElement.nativeElement.clientWidth;
        const containerHeight = this.gridListElement.nativeElement.clientHeight;
        const ratio = containerWidth / containerHeight;

        let rows = 1;
        let columns = 1;

        // this is a heuristic of calculating the division of rows and columns for displaying the layers
        while (rows * columns < numberOfLayers) {
            if (columns <= rows * ratio) {
                columns += 1;
            } else {
                rows += 1;
            }
        }

        while ((columns - 1) * rows >= numberOfLayers) {
            // reduce unnecessary columns
            columns -= 1;
        }

        this.numberOfRows = columns;
        this.numberOfColumns = columns;
    }

    private initOpenlayersMap(projection: SpatialReference): void {
        this.maps = [
            new OlMap({
                controls: [],
            }),
        ];
        this.createAndSetView(projection);
    }

    private initUserSelect(): void {
        this.userSelect = new OlInteractionSelect({style: null as any});
        this.attachUserSelectToMap();

        this.userSelect.on(['select'], (selectEvent) => {
            if (!(selectEvent instanceof OlSelectEvent)) {
                throw new Error(`unexpected event type ${selectEvent.type}}, expected ${`select`}`);
            }

            if (selectEvent.selected.length > 0) {
                this.projectService.setSelectedFeature((selectEvent as any).selected[0]);
            } else {
                this.projectService.setSelectedFeature(undefined);
            }
        });

        this.projectService.getSelectedFeatureStream().subscribe((selection) => {
            this.resetSelection();
            this.performSelection(selection);
        });
    }

    private performSelection(selection: FeatureSelection): void {
        if (!selection.feature) {
            return;
        }
        // TODO: avoid going through all layers
        for (const layer of this.mapLayersRaw) {
            const source = layer.mapLayer.getSource();
            if (source instanceof OlSourceVector) {
                for (const feature of source.getFeatures()) {
                    if (feature.getId() === selection.feature) {
                        this.selectedFeature = feature;
                        this.selectedFeatureOriginalStyle = feature.getStyle();
                        const style = (layer.symbology as VectorSymbology).createHighlightStyle(feature);
                        feature.setStyle(style);
                        this.userSelect?.getFeatures().push(feature);
                        return;
                    }
                }
            }
        }
    }

    private resetSelection(): void {
        this.userSelect?.getFeatures().clear();
        if (!this.selectedFeature) {
            return;
        }

        // TODO: avoid going through all layers
        for (const layer of this.mapLayersRaw) {
            const source = layer.mapLayer.getSource();
            if (source instanceof OlSourceVector) {
                for (const feature of source.getFeatures()) {
                    if (feature.getId() === this.selectedFeature.getId()) {
                        this.selectedFeature = undefined;
                        feature.setStyle(this.selectedFeatureOriginalStyle);
                        return;
                    }
                }
            }
        }
    }

    private attachUserSelectToMap(): void {
        if (!this.userSelect) {
            // called too early
            return;
        }

        // TODO: add to all maps in grid view
        const map: OlMap = this.maps[0];
        map.addInteraction(this.userSelect);
    }

    private redrawLayers(projection: SpatialReference): void {
        this.mapLayers = this.mapLayersRaw.filter((mapLayer) => mapLayer.isVisible);

        this.calculateGrid();
        this.changeDetectorRef.detectChanges();

        if (this.grid && this.mapLayers.length && this.mapContainers.length !== this.mapLayers.length) {
            console.error('race condition!');
        }

        while (this.maps.length > this.desiredNumberOfMaps()) {
            const removedMap = this.maps.pop();
            removedMap?.setTarget(undefined); // remove DOM reference to map
        }
        while (this.maps.length < this.desiredNumberOfMaps()) {
            // enlarge maps if necessary
            this.maps.push(
                new OlMap({
                    controls: [],
                    view: this.view,
                }),
            );
        }

        this.mapContainers.forEach((mapContainer, i) => {
            const mapTarget: HTMLElement = mapContainer.nativeElement.children[0];
            this.maps[i].setTarget(mapTarget);
            this.maps[i].updateSize();
        });

        const oldProjection = this.view ? this.view.getProjection() : undefined;
        const projectionChanged = oldProjection?.getCode() !== projection.srsString;

        if (projectionChanged) {
            this.createAndSetView(projection);
        }

        if (projectionChanged || !this.backgroundLayerSource) {
            this.backgroundLayerSource = this.createBackgroundLayerSource(projection);

            this.backgroundLayers.length = 0;
        }

        if (this.backgroundLayers.length > this.desiredNumberOfMaps()) {
            // reduce background layers if necessary
            this.backgroundLayers.length = this.desiredNumberOfMaps();
        }
        while (this.backgroundLayers.length < this.desiredNumberOfMaps()) {
            // create background layers if necessary
            this.backgroundLayers.push(this.createBackgroundLayer(projection));
        }

        this.maps.forEach((map, index) => {
            map.getLayers().clear();
            map.getLayers().push(this.backgroundLayers[index]);

            if (this.grid) {
                if (this.mapLayers.length) {
                    const inverseIndex = this.mapLayers.length - index - 1;
                    map.getLayers().push(this.mapLayers[inverseIndex].mapLayer);
                }
            } else {
                this.mapLayers.forEach((layerComponent) => map.addLayer(layerComponent.mapLayer));
            }
        });

        this.reattachDrawInteractions();

        this.attachUserSelectToMap();
    }

    private desiredNumberOfMaps(): number {
        return this.grid ? Math.max(this.mapLayers.length, 1) : 1;
    }

    private createAndSetView(projection: SpatialReference): void {
        let zoomLevel = this.view ? this.view.getZoom() : DEFAULT_ZOOM_LEVEL;
        const olProjection = this.spatialReferenceService.getOlProjection(projection);

        let newCenterPoint: OlGeomPoint;
        if (this.view && this.view.getCenter()) {
            const oldCenterPoint = new OlGeomPoint(this.view.getCenter() as any);
            newCenterPoint = oldCenterPoint.transform(this.view.getProjection(), olProjection) as OlGeomPoint;

            if (!containsCoordinate(olProjection.getExtent(), newCenterPoint.getCoordinates())) {
                newCenterPoint = new OlGeomPoint(getCenter(olProjection.getExtent()));
                zoomLevel = DEFAULT_ZOOM_LEVEL;
            }
        } else {
            newCenterPoint = new OlGeomPoint([0, 0]);
        }

        this.view = new OlView({
            projection: olProjection,
            center: newCenterPoint.getCoordinates(),
            minZoom: MIN_ZOOM_LEVEL,
            maxZoom: MAX_ZOOM_LEVEL,
            zoom: zoomLevel,
            enableRotation: false,
            constrainResolution: true, // no intermediate zoom levels
            multiWorld: true,
        });
        this.maps.forEach((map) => map.setView(this.view));

        this.emitViewportSize();

        // get resolution changes
        // TODO: update selected features
        // this.view.on('change:resolution', () => {
        //     // remove selected features on resolution change
        //     this.layerService.updateSelectedFeatures(
        //         [],
        //         this.layerService.getSelectedFeatures().selected.toArray()
        //     );
        // });
    }

    private emitViewportSize(): void {
        const resolution = this.view.getResolution();
        if (!resolution) {
            return;
        }

        this.mapService.setViewportSize({
            extent: olExtentToTuple(this.view.calculateExtent(this.maps[0].getSize())),
            resolution,
            maxExtent: olExtentToTuple(this.view.getProjection().getExtent()),
        });
    }

    private createBackgroundLayer(projection: SpatialReference): OlLayer<OlSource, any> {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === WEB_MERCATOR.spatialReference) {
                    return new OlLayerTile({
                        source: this.backgroundLayerSource as any,
                        // wrapX: false,
                    });
                } else {
                    return new OlLayerImage({
                        // placeholder image
                        source: this.backgroundLayerSource as any,
                    });
                }
            case 'countries': // eslint-disable-line no-fallthrough, ,
                return new OlLayerVector({
                    source: this.backgroundLayerSource as any,
                    style: (feature: OlFeatureLike, _resolution: number): OlStyleStyle => {
                        if (feature.getId() === 'BACKGROUND') {
                            return new OlStyleStyle({
                                fill: new OlStyleFill({
                                    color: '#ADD8E6',
                                }),
                            });
                        } else {
                            return new OlStyleStyle({
                                stroke: new OlStyleStroke({
                                    color: 'rgba(0, 0, 0, 1)',
                                    width: 1,
                                }),
                                fill: new OlStyleFill({
                                    color: 'rgba(210, 180, 140, 1)',
                                }),
                            });
                        }
                    },
                });
            case 'hosted':
            case 'eumetview':
            case 'XYZ':
                return new OlLayerTile({
                    source: this.backgroundLayerSource as OlTileWmsSource,
                });
            default:
                throw Error('Unknown Background Layer Name');
        }
    }

    private createBackgroundLayerSource(projection: SpatialReference): OlSource {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === WEB_MERCATOR.spatialReference) {
                    return new OlSourceOSM();
                } else {
                    return new OlImageStatic({
                        imageExtent: [0, 0, 0, 0],
                        url: '',
                    });
                }
            case 'eumetview':
                return new OlTileWmsSource({
                    url: 'https://view.eumetsat.int/geoserver/ows',
                    params: {
                        layers: 'backgrounds:ne_background',
                        projection: projection.srsString,
                        version: '1.3.0',
                    },
                    wrapX: false,
                    projection: projection.srsString,
                    crossOrigin: 'anonymous',
                });
            case 'countries': // eslint-disable-line no-fallthrough
                return new OlSourceVector({
                    url: 'assets/countries.geo.json',
                    format: new OlFormatGeoJSON(),
                });
            case 'hosted':
                return new OlTileWmsSource({
                    url: this.config.MAP.HOSTED_BACKGROUND_SERVICE,
                    params: {
                        layers: this.config.MAP.HOSTED_BACKGROUND_LAYER_NAME,
                        projection: projection.srsString,
                        version: this.config.MAP.HOSTED_BACKGROUND_SERVICE_VERSION,
                    },
                    wrapX: false,
                    projection: projection.srsString,
                    crossOrigin: 'anonymous',
                });
            case 'XYZ':
                return new XYZ({
                    url: this.config.MAP.BACKGROUND_LAYER_URL,
                    wrapX: false,
                    projection: projection.srsString,
                });
            default:
                throw Error('Unknown Background Layer Name');
        }
    }
}
