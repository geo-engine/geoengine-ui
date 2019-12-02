import {combineLatest, Observable, Subscription} from 'rxjs';
import {first, map as rxMap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy, ChangeDetectorRef,
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
import {AbstractVectorSymbology, Symbology} from '../../layers/symbology/symbology.model';
import {Layer} from '../../layers/layer.model';
import {LayerService} from '../../layers/layer.service';
import {ProjectService} from '../../project/project.service';
import {MapService} from '../map.service';
import {Config} from '../../config.service';
import {StyleCreator} from '../style-creator';
import {LayoutService} from '../../layout.service';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';

type MapLayer = MapLayerComponent<OlLayer, OlSource, Symbology, Layer<Symbology>>;

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

    // display a grid of maps or all layers on a single map
    @Input() grid = true; // TODO: false;

    @ViewChild(MatGridList, {read: ElementRef}) gridListElement !: ElementRef;
    @ViewChildren(MatGridTile, {read: ElementRef}) mapContainers !: QueryList<ElementRef>;

    @ContentChildren(MapLayerComponent) mapLayersRaw !: QueryList<MapLayer>;
    mapLayers: Array<MapLayer> = []; // filtered

    numberOfRows = 1;
    numberOfColumns = 1;
    rowHeight = 'fit';

    private projection$: Observable<Projection> = this.projectService.getProjectionStream();

    private maps: Array<OlMap>;
    private view: OlView;
    private backgroundLayerSource: OlSource;
    private backgroundLayers: Array<OlLayer> = [];

    private drawInteraction: OlInteractionDraw;

    private drawInteractionLayer: OlLayerVector;
    private subscriptions: Array<Subscription> = [];

    constructor(private config: Config,
                private changeDetectorRef: ChangeDetectorRef,
                private mapService: MapService,
                private layerService: LayerService,
                private layoutService: LayoutService,
                private projectService: ProjectService) {
        // set dummy maps so that they are not uninitialized
        this.view = new OlView({
            zoom: DEFAULT_ZOOM_LEVEL,
        });
        this.maps = [new OlMap({
            view: this.view,
        })];
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    ngAfterViewInit() {
        this.projection$.pipe(first()).subscribe(projection => {
            this.initOpenlayersMap(projection);

            // this.mapContainers.forEach((container, i) => this.maps[0].setTarget(container.nativeElement));
            // TODO: init more than one?

            this.maps[0].on('moveend', _event => this.emitViewportSize());

            this.mapLayers.forEach(layerComponent => this.maps[0].addLayer(layerComponent.mapLayer));

            this.subscriptions.push(
                combineLatest(
                    this.mapLayersRaw.changes,
                    this.projection$,
                ).pipe(
                    rxMap(([_changes, newProjection]) => newProjection)
                ).subscribe((newProjection: Projection) => {
                    this.redrawLayers(newProjection);
                })
            );
        });
    }

    ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
        for (let propName in changes) {
            if (propName === 'grid') {
                // TODO: implement grid switch
            }
        }
    }

    /**
     * Notify the map that the container has resized.
     */
    resize() {
        setTimeout(() => this.maps.forEach(map => map.updateSize()));
    }

    zoomIn() {
        if (this.view.getZoom() < MAX_ZOOM_LEVEL) {
            this.view.adjustZoom(1);
        }
    }

    zoomOut() {
        if (this.view.getZoom() > MIN_ZOOM_LEVEL) {
            this.view.adjustZoom(-1);
        }
    }

    public startDrawInteraction(drawType: OlGeometryType) {
        if (this.drawInteraction) {
            throw new Error('only one draw interaction can be active!');
        }

        if (this.drawInteractionLayer) {
            throw new Error('only one draw layer can be active!');
        }

        const source = new OlSourceVector({wrapX: false});

        this.drawInteractionLayer = new OlLayerVector({
            source: source,
        });

        this.drawInteraction = new OlInteractionDraw({
            source: source,
            type: drawType
        });

        this.maps[0].addLayer(this.drawInteractionLayer);
        this.maps[0].addInteraction(this.drawInteraction);
    }

    public isDrawInteractionAttached(): boolean {
        return (!!this.drawInteraction && !!this.drawInteractionLayer);
    }

    public endDrawInteraction(): OlSourceVector {
        if (!this.drawInteraction || !this.drawInteractionLayer) {
            console.error('no interaction or layer active!');
            return undefined;
        }

        const source = this.drawInteractionLayer.getSource();
        this.maps[0].removeInteraction(this.drawInteraction);
        this.maps[0].removeLayer(this.drawInteractionLayer);
        this.drawInteractionLayer = undefined;
        this.drawInteraction = undefined;

        return source;
    }

    public layerForcesRedraw() {
        this.projection$.pipe(first()).subscribe(projection => this.redrawLayers(projection));
    }

    private calculateGrid() {
        const containerWidth = this.gridListElement.nativeElement.clientWidth;
        const containerHeight = this.gridListElement.nativeElement.clientHeight;

        if (!this.grid) {
            this.numberOfRows = 1;
            this.numberOfColumns = 1;

            return;
        }

        const numberOfLayers = Math.max(this.mapLayers.length, 1); // require at least one space;
        const ratio = containerWidth / containerHeight;

        let rows = 1;
        let columns = 1;

        let capacity = rows * columns;
        for (let i = capacity; i <= numberOfLayers; ++i) {
            if (i > capacity) { // need more space
                if (columns <= rows * ratio) {
                    columns += 1;
                } else {
                    rows += 1;

                    while ((columns - 1) * rows >= numberOfLayers) { // reduce unnecessary columns
                        columns -= 1;
                    }
                }
                capacity = rows * columns;
            }
        }

        this.numberOfRows = columns;
        this.numberOfColumns = columns;
    }

    private initOpenlayersMap(projection: Projection) {
        this.maps = [new OlMap({
            controls: [],
            logo: false,
            loadTilesWhileAnimating: true,  // TODO: check if moved to layer
            loadTilesWhileInteracting: true, // TODO: check if moved to layer
        })];
        this.createAndSetView(projection);

        let selectedOlLayers: Array<OlLayer> = undefined;

        // add the select interaction to the map
        const select = new OlInteractionSelect({
            layers: (layerCandidate: OlLayer) => layerCandidate === selectedOlLayers[0],
            wrapX: false,
        });
        (select as any).setActive(false);
        this.maps.forEach(map => map.addInteraction(select));
        select.on(['select'], (event: {}) => {
            const selectEvent = event as OlInteractionSelectEvent;
            const selectedSymbology = this.layerService.getSelectedLayer().symbology;

            if (selectedSymbology instanceof AbstractVectorSymbology) {
                const highlightSymbology = StyleCreator.createHighlightSymbology(
                    selectedSymbology as AbstractVectorSymbology
                );
                const highlightStyle = StyleCreator.fromVectorSymbology(highlightSymbology);
                selectEvent.selected.forEach((feature) => {
                    feature.setStyle(highlightStyle);
                });
            }

            selectEvent.deselected.forEach((feature) => {
                feature.setStyle(undefined);
            });

            this.layerService.updateSelectedFeatures(
                selectEvent.selected.map(
                    feature => feature.getId()
                ),
                selectEvent.deselected.map(
                    feature => feature.getId()
                )
            );
        });

        this.layerService.getSelectedLayerStream().subscribe(layer => {
            select.getFeatures().forEach((feature) => {
                feature.setStyle(undefined);
            });
            select.getFeatures().clear();
            if (layer && select) {
                selectedOlLayers = this.mapLayers.filter(
                    olLayerComponent => olLayerComponent.layer === layer
                ).map(
                    olLayerComponent => olLayerComponent.mapLayer
                );
                select.setActive(true);
            } else {
                select.setActive(false);
            }
        });

        this.layerService.getSelectedFeaturesStream().subscribe(selected => {
            const selectedLayer = this.layerService.getSelectedLayer();

            let newSelect = new OlCollection<OlFeature>();
            select.getFeatures().forEach(feature => {
                if (selected.remove && selected.remove.contains(feature.getId())) {
                    newSelect.push(feature);
                    feature.setStyle(undefined);
                }
            });

            newSelect.forEach(feature => {
                select.getFeatures().remove(feature);
            });

            // TODO: clean this up when selected layer is removed
            if (selectedOlLayers) {
                selectedOlLayers.forEach(layer => {
                    if (layer instanceof OlLayerVector && selectedLayer) {
                        const highlightSymbology = StyleCreator.createHighlightSymbology(
                            selectedLayer.symbology as AbstractVectorSymbology
                        );
                        const highlightStyle = StyleCreator.fromVectorSymbology(highlightSymbology);

                        const vectorLayer = layer as OlLayerVector;
                        vectorLayer.getSource().getFeatures().forEach(feature => {
                            if (selected.add && selected.add.contains(feature.getId())) {
                                if (select.getFeatures().getArray().indexOf(feature) === -1) {
                                    select.getFeatures().push(feature);
                                    // todo: add resolution as third parameter
                                    feature.setStyle(highlightStyle);
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    private redrawLayers(projection: Projection) {
        this.mapLayers = this.mapLayersRaw.filter(layer => layer.visible);

        this.calculateGrid();
        this.changeDetectorRef.detectChanges(); // TODO: race condition?

        if (this.grid && this.mapContainers.length !== this.mapLayers.length) {
            console.error('race condition!');
        }

        while (this.maps.length > this.desiredNumberOfMaps()) {
            const removedMap = this.maps.pop();
            removedMap.setTarget(undefined); // remove DOM reference to map
        }
        while (this.maps.length < this.desiredNumberOfMaps()) { // enlarge maps if necessary
            this.maps.push(new OlMap({
                controls: [],
                logo: false,
                view: this.view,
                loadTilesWhileAnimating: true,  // TODO: check if moved to layer
                loadTilesWhileInteracting: true, // TODO: check if moved to layer
            }));
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

        if (this.backgroundLayers.length > this.desiredNumberOfMaps()) { // reduce background layers if necessary
            this.backgroundLayers.length = this.desiredNumberOfMaps();
        }
        while (this.backgroundLayers.length < this.desiredNumberOfMaps()) { // create background layers if necessary
            this.backgroundLayers.push(this.createBackgroundLayer(projection));
        }

        // const mapLayers = this.mapLayers.toArray();
        this.maps.forEach((map, index) => {
            map.getLayers().clear();
            map.getLayers().push(this.backgroundLayers[index]);

            if (this.grid) {
                const inverseIndex = this.mapLayers.length - index - 1;
                map.getLayers().push(this.mapLayers[inverseIndex].mapLayer);
            } else {
                this.mapLayers.forEach(layerComponent => map.addLayer(layerComponent.mapLayer));
            }
        });
    }

    private desiredNumberOfMaps(): number {
        return this.grid ? this.mapLayers.length : 1;
    }

    private createAndSetView(projection: Projection) {
        const zoomLevel = this.view ? this.view.getZoom() : DEFAULT_ZOOM_LEVEL;

        let newCenterPoint: OlGeomPoint;
        if (this.view && this.view.getCenter()) {
            const oldCenterPoint = new OlGeomPoint(this.view.getCenter());
            newCenterPoint = oldCenterPoint.transform(
                this.view.getProjection(),
                projection.getOpenlayersProjection(),
            ) as OlGeomPoint;
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
        this.maps.forEach(map => map.setView(this.view));

        this.emitViewportSize();

        // get resolution changes
        this.view.on('change:resolution', () => {
            // remove selected features on resolution change
            this.layerService.updateSelectedFeatures(
                [],
                this.layerService.getSelectedFeatures().selected.toArray()
            );
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
                    return new OlLayerImage({ // placeholder image
                        source: this.backgroundLayerSource,
                    });
                }
            case 'countries': // tslint:disable-line:no-switch-case-fall-through <-- BUG
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
            case 'countries': // tslint:disable-line:no-switch-case-fall-through <-- BUG
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
