import {combineLatest, Observable, Subscription} from 'rxjs';
import {first, map as rxMap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
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
    @Input() grid = false;

    @ViewChild('mapContainer') mapContainer: ElementRef;
    @ViewChildren('.map') mapContainers: QueryList<ElementRef>;

    @ContentChildren(MapLayerComponent) mapLayers: QueryList<MapLayer>;

    numberOfColumns: number;
    rowHeight: number;

    private projection$: Observable<Projection> = this.projectService.getProjectionStream();

    private maps: Array<OlMap>;
    private view: OlView;
    private backgroundLayer: OlLayer;

    private drawInteraction: OlInteractionDraw;

    private drawInteractionLayer: OlLayerVector;
    private subscriptions: Array<Subscription> = [];

    constructor(private config: Config,
                private mapService: MapService,
                private layerService: LayerService,
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

            this.maps[0].setTarget(this.mapContainer.nativeElement);

            this.maps[0].on('moveend', _event => this.emitViewportSize());

            this.mapLayers.forEach(layerComponent => this.maps[0].addLayer(layerComponent.mapLayer));

            this.subscriptions.push(
                combineLatest(
                    this.mapLayers.changes,
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
        console.log('map changes', changes, this);

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
        const oldProjection = this.view ? this.view.getProjection() : undefined;
        const projectionChanged = oldProjection !== projection.getOpenlayersProjection();

        if (projectionChanged) {
            this.createAndSetView(projection);
        }

        if (projectionChanged || !this.backgroundLayer) {
            this.backgroundLayer = this.createBackgroundLayer(projection);
        }

        this.maps.forEach(map => {
            map.getLayers().clear();
            map.getLayers().push(this.backgroundLayer);

            this.mapLayers.forEach(
                layerComponent => map.addLayer(layerComponent.mapLayer)
            );
        });
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
                        source: new OlSourceOSM(),
                        wrapX: false,
                    });
                } else {
                    return new OlLayerImage({ // placeholder image
                        source: new OlImageStatic({
                            imageExtent: [0, 0, 0, 0],
                        }),
                    });
                }
            case 'countries': // tslint:disable-line:no-switch-case-fall-through <-- BUG
                return new OlLayerVector({
                    source: new OlSourceVector({
                        url: 'assets/countries.geo.json',
                        format: new OlFormatGeoJSON(),
                    }),
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
                const hostedSource = new OlTileWmsSource({
                    url: this.config.MAP.HOSTED_BACKGROUND_SERVICE,
                    params: {
                        layers: this.config.MAP.HOSTED_BACKGROUND_LAYER_NAME,
                        projection: projection.getCode(),
                        version: this.config.MAP.HOSTED_BACKGROUND_SERVICE_VERSION,
                    },
                    wrapX: false,
                    projection: projection.getCode(),
                });
                return new OlLayerTile({
                    source: hostedSource,
                });
            case 'XYZ':
                const xyzSource = new XYZ({
                    url: this.config.MAP.BACKGROUND_LAYER_URL,
                    wrapX: false,
                    projection: projection.getCode(),
                });
                return new OlLayerTile({
                    source: xyzSource,
                });
            default:
                throw Error('Unknown Background Layer Name');
        }
    }
}
