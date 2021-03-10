import {combineLatest, Observable, Subscription} from 'rxjs';
import {first, map as rxMap} from 'rxjs/operators';

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
import OlCollection from 'ol/Collection';
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
import OlStyleStyle from 'ol/style/Style';

import OlInteractionDraw from 'ol/interaction/Draw';
import OlInteractionSelect from 'ol/interaction/Select';
import {SelectEvent as OlInteractionSelectEvent} from 'ol/interaction/Select';

import {MapLayerComponent} from '../map-layer.component';

import {Projection, Projections} from '../../operators/projection.model';
import {AbstractVectorSymbology, AbstractSymbology} from '../../layers/symbology/symbology.model';
import {Layer} from '../../layers/layer.model';
import {LayerService} from '../../layers/layer.service';
import {ProjectService} from '../../project/project.service';
import {Extent, MapService} from '../map.service';
import {Config} from '../../config.service';
import {StyleCreator} from '../style-creator';
import {LayoutService} from '../../layout.service';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';

type MapLayer = MapLayerComponent<OlLayer, OlSource, AbstractSymbology, Layer<AbstractSymbology>>;

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

    private projection$: Observable<Projection> = this.projectService.getProjectionStream();

    private maps: Array<OlMap>;
    private view: OlView;
    private backgroundLayerSource: OlSource;
    private backgroundLayers: Array<OlLayer> = [];

    private selectedOlLayer: OlLayer = undefined;
    private userSelect: OlInteractionSelect;

    private drawInteractionSource: OlSourceVector;
    private drawType: OlGeometryType;
    private drawInteractions: Array<OlInteractionDraw> = [];
    private drawInteractionLayers: Array<OlLayerVector> = [];

    private subscriptions: Array<Subscription> = [];

    /**
     * Create the component and inject several dependencies via DI.
     */
    constructor(
        private config: Config,
        private changeDetectorRef: ChangeDetectorRef,
        private mapService: MapService,
        private layerService: LayerService,
        private layoutService: LayoutService,
        private projectService: ProjectService,
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

    ngOnDestroy() {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    ngAfterViewInit() {
        this.projection$.pipe(first()).subscribe((projection) => {
            this.maps.forEach((map) => map.setTarget(undefined)); // initially reset all DOM bindings

            this.initOpenlayersMap(projection);

            // since all viewports are linked and there will always be the first map, we link the event only to map 0
            this.maps[0].on('moveend', (_event) => this.emitViewportSize());

            this.initUserSelect();

            this.subscriptions.push(
                combineLatest(this.mapLayersRaw.changes, this.projection$)
                    .pipe(rxMap(([_changes, newProjection]) => newProjection))
                    .subscribe((newProjection: Projection) => {
                        this.redrawLayers(newProjection);
                    }),
            );
        });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (const propName in changes) {
            if (propName === 'grid') {
                this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection));
            }
        }
    }

    /**
     * Notify the map that the container has resized.
     */
    resize() {
        setTimeout(() => this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection)));
    }

    /**
     * Increases the zoom level if it is not larger than the maximum zoom level
     */
    zoomIn() {
        if (this.view.getZoom() < MAX_ZOOM_LEVEL) {
            this.view.adjustZoom(1);
        }
    }

    /**
     * Decreases the zoom level if it is not smaller than the minimum zoom level
     */
    zoomOut() {
        if (this.view.getZoom() > MIN_ZOOM_LEVEL) {
            this.view.adjustZoom(-1);
        }
    }

    /**
     * Zoom to and focus a bounding box
     */
    zoomTo(boundingBox: Extent) {
        this.view.fit(boundingBox, {
            nearest: true,
            maxZoom: MAX_ZOOM_LEVEL,
        });
    }

    /**
     * Enable user input (hand drawn) for the map
     */
    public startDrawInteraction(drawType: OlGeometryType) {
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
    public endDrawInteraction(): OlSourceVector {
        if (!this.isDrawInteractionAttached()) {
            console.error('no interaction or layer active!');
            return undefined;
        }

        const source = this.drawInteractionSource;

        this.drawInteractionSource = undefined;

        this.reattachDrawInteractions();

        return source;
    }

    private createDrawInteractionLayer(): OlLayerVector {
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

    private reattachDrawInteractions() {
        // remove layers
        this.drawInteractionLayers.forEach((layer, index) => {
            if (index < this.maps.length) {
                this.maps[index].removeLayer(layer);
            }
            layer.setMap(undefined);
        });
        this.drawInteractionLayers.length = 0;

        // remove interactions
        this.drawInteractions.forEach((interaction, index) => {
            if (index < this.maps.length) {
                this.maps[index].removeInteraction(interaction);
            }
            interaction.setMap(undefined);
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

    /**
     * Force a redraw for each map layer
     */
    public layerForcesRedraw() {
        this.projection$.pipe(first()).subscribe((projection) => this.redrawLayers(projection));
    }

    private calculateGrid() {
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

    private initOpenlayersMap(projection: Projection) {
        this.maps = [
            new OlMap({
                controls: [],
                logo: false,
                loadTilesWhileAnimating: true, // TODO: check if moved to layer
                loadTilesWhileInteracting: true, // TODO: check if moved to layer
            }),
        ];
        this.createAndSetView(projection);
    }

    private initUserSelect() {
        this.userSelect = new OlInteractionSelect({
            layers: (layerCandidate: OlLayer) => layerCandidate === this.selectedOlLayer,
        });
        this.userSelect.setActive(false);

        this.subscriptions.push(
            this.layerService.getSelectedLayerStream().subscribe((selectedLayer) => {
                // reset old selection
                this.userSelect.getFeatures().forEach((feature) => feature.setStyle(undefined));
                this.userSelect.getFeatures().clear();

                const filteredLayers = this.mapLayers.filter((mapLayer) => mapLayer.layer === selectedLayer);
                this.selectedOlLayer = filteredLayers.length ? filteredLayers[0].mapLayer : undefined;
                this.userSelect.setActive(!!this.selectedOlLayer);

                this.attachUserSelectToMap();
            }),
        );

        this.userSelect.on('select', (selectEvent: OlInteractionSelectEvent) => {
            const selectedLayerSymbology = this.layerService.getSelectedLayer().symbology;

            if (selectedLayerSymbology instanceof AbstractVectorSymbology) {
                const highlightSymbology = StyleCreator.createHighlightSymbology(selectedLayerSymbology);
                const highlightStyle = StyleCreator.fromVectorSymbology(highlightSymbology);
                selectEvent.selected.forEach((feature) => feature.setStyle(highlightStyle));
            }

            selectEvent.deselected.forEach((feature) => feature.setStyle(undefined));

            this.layerService.updateSelectedFeatures(
                selectEvent.selected.map((feature) => feature.getId()),
                selectEvent.deselected.map((feature) => feature.getId()),
            );
        });

        this.subscriptions.push(
            this.layerService.getSelectedFeaturesStream().subscribe((selectedFeatures) => {
                const newSelection = new OlCollection<OlFeature>();
                this.userSelect.getFeatures().forEach((feature) => {
                    if (selectedFeatures.remove && selectedFeatures.remove.contains(feature.getId())) {
                        newSelection.push(feature);
                        feature.setStyle(undefined);
                    }
                });

                newSelection.forEach((feature) => this.userSelect.getFeatures().remove(feature));

                const selectedLayer = this.layerService.getSelectedLayer();

                if (!selectedLayer || !this.selectedOlLayer) {
                    return;
                }

                if (this.selectedOlLayer instanceof OlLayerVector) {
                    const highlightSymbology = StyleCreator.createHighlightSymbology(selectedLayer.symbology as AbstractVectorSymbology);
                    const highlightStyle = StyleCreator.fromVectorSymbology(highlightSymbology);

                    this.selectedOlLayer
                        .getSource()
                        .getFeatures()
                        .forEach((feature) => {
                            if (selectedFeatures.add && selectedFeatures.add.contains(feature.getId())) {
                                if (this.userSelect.getFeatures().getArray().indexOf(feature) === -1) {
                                    this.userSelect.getFeatures().push(feature);
                                    // todo: add resolution as third parameter
                                    feature.setStyle(highlightStyle);
                                }
                            }
                        });
                }
            }),
        );
    }

    private attachUserSelectToMap() {
        if (!this.userSelect) {
            // called too early
            return;
        }

        let map;
        if (!this.selectedOlLayer) {
            map = undefined;
        } else if (this.maps.length === 1) {
            // mono map, no choice
            map = this.maps[0];
        } else {
            const selectedLayerIndex = this.mapLayers.map((layer) => layer.mapLayer).indexOf(this.selectedOlLayer);
            if (selectedLayerIndex >= 0) {
                const inverseIndex = this.maps.length - selectedLayerIndex - 1;
                map = this.maps[inverseIndex];
            } else {
                map = undefined; // actually, something went wrong
            }
        }

        const oldMap = this.userSelect.getMap();
        if (map !== oldMap) {
            if (oldMap) {
                oldMap.removeInteraction(this.userSelect);
            }
            this.userSelect.setMap(map);
            if (map) {
                map.addInteraction(this.userSelect);
            }
        }
    }

    private redrawLayers(projection: Projection) {
        this.mapLayers = this.mapLayersRaw.filter((mapLayer) => mapLayer.layer.visible);

        this.calculateGrid();
        this.changeDetectorRef.detectChanges();

        if (this.grid && this.mapLayers.length && this.mapContainers.length !== this.mapLayers.length) {
            console.error('race condition!');
        }

        while (this.maps.length > this.desiredNumberOfMaps()) {
            const removedMap = this.maps.pop();
            removedMap.setTarget(undefined); // remove DOM reference to map
        }
        while (this.maps.length < this.desiredNumberOfMaps()) {
            // enlarge maps if necessary
            this.maps.push(
                new OlMap({
                    controls: [],
                    logo: false,
                    view: this.view,
                    loadTilesWhileAnimating: true, // TODO: check if moved to layer
                    loadTilesWhileInteracting: true, // TODO: check if moved to layer
                }),
            );
        }

        this.mapContainers.forEach((mapContainer, i) => {
            const mapTarget: HTMLElement = mapContainer.nativeElement.children[0];
            this.maps[i].setTarget(mapTarget);
            this.maps[i].updateSize();
        });

        const oldProjection = this.view ? this.view.getProjection() : undefined;
        const projectionChanged = oldProjection !== projection.getOpenlayersProjection();

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

    private createAndSetView(projection: Projection) {
        const zoomLevel = this.view ? this.view.getZoom() : DEFAULT_ZOOM_LEVEL;

        let newCenterPoint: OlGeomPoint;
        if (this.view && this.view.getCenter()) {
            const oldCenterPoint = new OlGeomPoint(this.view.getCenter());
            newCenterPoint = oldCenterPoint.transform(this.view.getProjection(), projection.getOpenlayersProjection()) as OlGeomPoint;
        } else {
            newCenterPoint = new OlGeomPoint([0, 0]);
        }

        this.view = new OlView({
            projection: projection.getOpenlayersProjection(),
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
        this.view.on('change:resolution', () => {
            // remove selected features on resolution change
            this.layerService.updateSelectedFeatures([], this.layerService.getSelectedFeatures().selected.toArray());
        });
    }

    private emitViewportSize() {
        this.mapService.setViewportSize({
            extent: this.view.calculateExtent(this.maps[0].getSize()),
            resolution: this.view.getResolution(),
            maxExtent: this.view.getProjection().getExtent(),
        });
    }

    private createBackgroundLayer(projection: Projection): OlLayerImage {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === Projections.WEB_MERCATOR) {
                    return new OlLayerTile({
                        source: this.backgroundLayerSource,
                        wrapX: false,
                    });
                } else {
                    return new OlLayerImage({
                        // placeholder image
                        source: this.backgroundLayerSource,
                    });
                }
            case 'countries': // eslint-disable-line no-fallthrough, ,
                return new OlLayerVector({
                    source: this.backgroundLayerSource,
                    style: (feature: OlFeature, _resolution: number): OlStyleStyle => {
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
                return new OlLayerTile({
                    source: this.backgroundLayerSource,
                });
            case 'XYZ':
                return new OlLayerTile({
                    source: this.backgroundLayerSource,
                });
            default:
                throw Error('Unknown Background Layer Name');
        }
    }

    private createBackgroundLayerSource(projection: Projection): OlSource {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === Projections.WEB_MERCATOR) {
                    return new OlSourceOSM();
                } else {
                    return new OlImageStatic({
                        imageExtent: [0, 0, 0, 0],
                    });
                }
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
                        projection: projection.getCode(),
                        version: this.config.MAP.HOSTED_BACKGROUND_SERVICE_VERSION,
                    },
                    wrapX: false,
                    projection: projection.getCode(),
                    crossOrigin: 'anonymous',
                });
            case 'XYZ':
                return new XYZ({
                    url: this.config.MAP.BACKGROUND_LAYER_URL,
                    wrapX: false,
                    projection: projection.getCode(),
                });
            default:
                throw Error('Unknown Background Layer Name');
        }
    }
}
