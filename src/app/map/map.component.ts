import {
    Component, ViewChild, ElementRef, Input, AfterViewInit, SimpleChange, OnChanges,
    ContentChildren, QueryList, ChangeDetectionStrategy, AfterContentInit, OnDestroy,
} from '@angular/core';

import ol from 'ol'
import OlMap from 'ol/map';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlInteractionSelect from 'ol/interaction/select';
import OlInteractionDraw from 'ol/interaction/draw';
import OlCollection from 'ol/collection';
import OlStyleStyle from 'ol/style/style';
import OlGeomPoint from 'ol/geom/point';
import OlView from 'ol/view';
import OlLayerTile from 'ol/layer/tile';
import OlStyleFill from 'ol/style/fill';
import OlSourceOSM from 'ol/source/osm';
import OlLayerImage from 'ol/layer/image';
import OlStyleStroke from 'ol/style/stroke';
import OlSourceTileWMS from 'ol/source/tilewms';
import OlFormatGeoJSON from 'ol/format/geojson';


import {OlMapLayerComponent} from './map-layer.component';

import {Projection, Projections} from '../operators/projection.model';
import {Symbology, AbstractVectorSymbology} from '../layers/symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {LayerService} from '../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {MapService} from './map.service';
import {Config} from '../config.service';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

type MapLayer = OlMapLayerComponent<ol.layer.Layer, ol.source.Source, Symbology, Layer<Symbology>>;

const DEFAULT_ZOOM_LEVEL = 2;

/**
 * The `ol-map` component represents an openLayers 3 map component.
 * it supports `ol-layer` components as child components.
 */
@Component({
    selector: 'wave-ol-map',
    template: `
        <div #mapContainer style='background: black; overflow: auto; height: 100%;'>
            <!--[style.height.px]='height'>-->
        </div>
        <ng-content></ng-content>
    `,
    queries: {
        contentChildren: new ContentChildren(OlMapLayerComponent),
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy, AfterContentInit {

    @Input() height: number;

    @ViewChild('mapContainer') mapContainer: ElementRef;

    @ContentChildren(OlMapLayerComponent) contentChildren: QueryList<MapLayer>;

    private projection$: Observable<Projection>;

    private map: ol.Map;

    private drawInteraction: ol.interaction.Draw;
    private drawInteractionSource: ol.source.Vector;
    private drawInteractionLayer: ol.layer.Vector;

    private layers: Array<Layer<Symbology>> = []; // HACK

    private subscriptions: Array<Subscription> = [];

    constructor(private config: Config,
                private mapService: MapService,
                private layerService: LayerService,
                private projectService: ProjectService) {
        this.projection$ = this.projectService.getProjectionStream();
        this.initOpenlayersMap();

        this.subscriptions.push(
            this.projection$.subscribe(projection => this.onProjectionChanged(projection))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    /**
     * Notify the map that the viewport has resized.
     */
    resize() {
        // will be set to false after view checked event
        // this.isSizeChanged = true;
        setTimeout(() => this.map.updateSize(), 0);
    }

    zoomIn() {
        const zoomLevel = this.map.getView().getZoom();
        this.map.getView().setZoom(zoomLevel + 1);
    }

    zoomOut() {
        const zoomLevel = this.map.getView().getZoom();
        this.map.getView().setZoom(zoomLevel - 1);
    }

    zoomToMap() {
        const extent = this.map.getView().getProjection().getExtent();
        this.zoomToExtent(extent);
    }

    zoomToLayer(layer: Layer<Symbology>) {
        const candidates = this.contentChildren.filter(
            olLayerComponent => olLayerComponent.layer === layer
        );

        const extent = candidates[0].getExtent();

        if (extent === undefined) {
            this.zoomToMap();
        } else {
            this.zoomToExtent(extent);
        }
    }

    zoomToExtent(extent: [number, number, number, number] | ol.Extent) {
        // this.map.getView().fit(extent, this.map.getSize());
        this.map.getView().fit(extent);
    }

    ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
        // console.log('map changes', changes, this);

        for (let propName in changes) {
            if (propName === 'height') {
                setTimeout(() => {
                    this.map.updateSize();
                });
            }
        }
    }

    ngAfterContentInit() {
        this.contentChildren.forEach(
            layerComponent => this.map.addLayer(layerComponent.mapLayer)
        );

        this.subscriptions.push(
            Observable.combineLatest(
                this.contentChildren.changes,
                this.projection$,
                (changes, projection) => projection,
            ).subscribe(projection => {
                // react on changes by removing all layers and inserting them
                // in the correct order.
                this.map.getLayers().clear();
                this.map.getLayers().push(this.createBackgroundLayer(projection));
                this.contentChildren.forEach(
                    layerComponent => this.map.getLayers().push(layerComponent.mapLayer)
                );
                if (this.drawInteractionLayer) {
                    this.map.getLayers().push(this.drawInteractionLayer);
                }
            })
        );

        // Hack: querylist ignores order changes
        this.projectService.getLayerStream().subscribe(x => {
            if (this.layers === x) {
                return;
            }

            let change = this.layers.length !== x.length;

            for (let i = 0; i < this.layers.length; i++) {
                if (this.layers[i] !== x[i]) {
                    change = true;
                    break;
                }
            }
            if (change) {
                this.contentChildren.setDirty();
                this.layers = x.slice(0);
            }
        });

        this.mapService.getZoomToExtentStream().subscribe(
            x => this.zoomToExtent(x)
        );

        this.mapService.getZoomToLayerStream().subscribe(
            l => this.zoomToLayer(l)
        );
    }

    ngAfterViewInit() {

        // set target for ol
        this.map.setTarget(this.mapContainer.nativeElement);
        // initialize layers
        // this.map.set('layers', [this.createBackgroundLayer(this.projection)]);
        //
        // const view = new ol.View({
        //     projection: this.projection.getOpenlayersProjection(),
        //     center: [0, 0],
        //     zoom: 2,
        // });
        //
        // this.map.setView(view);
        //
        // // get resolution changes
        // this.mapService.setViewportSize({
        //     extent: this.map.getView().calculateExtent(this.map.getSize()),
        //     resolution: this.map.getView().getResolution(),
        //     maxExtent: this.projection.getExtent(),
        // });
        //
        // view.on('change:resolution', () => {
        //     // remove selected features on resolution change
        //     this.layerService.updateSelectedFeatures(
        //         [],
        //         this.layerService.getSelectedFeatures().selected.toArray()
        //     );
        //
        //     // console.log('ngAfterViewInit', 'change:resolution', view.calculateExtent(this.map.getSize()));
        //     this.mapService.setViewportSize({
        //         extent: this.map.getView().calculateExtent(this.map.getSize()),
        //         resolution: this.map.getView().getResolution(),
        //         maxExtent: this.projection.getExtent(),
        //     });
        // });

        this.map.on('moveend', event => {
            // console.log('ngAfterViewInit', 'moveend', this.map.getView().calculateExtent(this.map.getSize()));

            this.projection$.first().subscribe(projection => {
                this.mapService.setViewportSize({
                    extent: this.map.getView().calculateExtent(this.map.getSize()),
                    resolution: this.map.getView().getResolution(),
                    maxExtent: projection.getExtent(),
                });
            });
        });
    }

    private initOpenlayersMap() {
        this.map = new OlMap({
            controls: [],
            logo: false,
            loadTilesWhileAnimating: true,  // TODO: check if moved to layer
            loadTilesWhileInteracting: true, // TODO: check if moved to layer
        });

        let selectedOlLayers: Array<ol.layer.Layer> = undefined;

        // add the select interaction to the map
        const select = new OlInteractionSelect({
            layers: (layerCandidate: ol.layer.Layer) => layerCandidate === selectedOlLayers[0],
            wrapX: false,
        });
        (select as any).setActive(false);
        this.map.addInteraction(select);
        select.on(['select'], (event: {}) => {
            const selectEvent = event as ol.interaction.Select.Event;
            const selectedSymbology = this.layerService.getSelectedLayer().symbology;

            if (selectedSymbology instanceof AbstractVectorSymbology) {
                const highlightSymbology = (
                    selectedSymbology as AbstractVectorSymbology
                ).getHighlightSymbology();

                selectEvent.selected.forEach((feature) => {
                    const highlightStyle = highlightSymbology.getOlStyle();
                    if (highlightStyle instanceof OlStyleStyle) {
                        feature.setStyle(highlightStyle);
                    } else {
                        const highlightStyleFunction = highlightStyle as ol.StyleFunction;
                        feature.setStyle(highlightStyleFunction.call(undefined, feature));
                    }
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
                selectedOlLayers = this.contentChildren.filter(
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
            let highlightStyleFunction = (feature: ol.Feature, resolution: number) => undefined as ol.style.Style | ol.style.Style[];
            if (selectedLayer !== undefined && selectedLayer.symbology instanceof AbstractVectorSymbology) {
                highlightStyleFunction =
                    (selectedLayer.symbology as AbstractVectorSymbology).getHighlightSymbology().getOlStyleAsFunction();
            }

            let newSelect = new OlCollection<ol.Feature>();
            select.getFeatures().forEach(feature => {
                if (selected.remove && selected.remove.contains(feature.getId())) {
                    newSelect.push(feature);
                    feature.setStyle(undefined);
                }
            });

            newSelect.forEach(feature => {
                select.getFeatures().remove(feature);
            });

            if (selectedOlLayers) {
                selectedOlLayers.forEach(layer => {
                    if (layer instanceof OlLayerVector) {
                        const vectorLayer = layer as ol.layer.Vector;
                        vectorLayer.getSource().getFeatures().forEach(feature => {
                            if (selected.add && selected.add.contains(feature.getId())) {
                                if (select.getFeatures().getArray().indexOf(feature) === -1) {
                                    select.getFeatures().push(feature);
                                    // todo: add resolution as third parameter
                                    feature.setStyle(highlightStyleFunction.call(undefined, feature, undefined));
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    private onProjectionChanged(projection: Projection) {
        const oldProjection = this.map.getView().getProjection();
        const newProjection = projection.getOpenlayersProjection();

        const oldCenter = this.map.getView().getCenter();
        const oldZoom = this.map.getView().getZoom();

        let newCenterPoint: ol.geom.Point;
        if (oldProjection && oldCenter) {
            const oldCenterPoint = new OlGeomPoint(oldCenter);
            newCenterPoint = oldCenterPoint.clone().transform(
                oldProjection, newProjection
            ) as ol.geom.Point;
        } else {
            newCenterPoint = new OlGeomPoint([0, 0]);
        }

        const view = new OlView({
            projection: projection.getOpenlayersProjection(),
            center: newCenterPoint.getCoordinates(),
            zoom: oldZoom ? oldZoom : DEFAULT_ZOOM_LEVEL,
        });
        this.map.setView(view);

        // get resolution changes
        this.mapService.setViewportSize({
            extent: this.map.getView().calculateExtent(this.map.getSize()),
            resolution: this.map.getView().getResolution(),
            maxExtent: projection.getExtent(),
        });

        view.on('change:resolution', () => {
            // remove selected features on resolution change
            this.layerService.updateSelectedFeatures(
                [],
                this.layerService.getSelectedFeatures().selected.toArray()
            );

            this.mapService.setViewportSize({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                resolution: this.map.getView().getResolution(),
                maxExtent: projection.getExtent(),
            });
        });

        this.map.getLayers().clear();
        this.map.getLayers().push(this.createBackgroundLayer(projection));
        this.contentChildren.forEach(
            layerComponent => this.map.addLayer(layerComponent.mapLayer)
        );
    }

    private createBackgroundLayer(projection: Projection): ol.layer.Image {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === Projections.WEB_MERCATOR) {
                    return new OlLayerTile({
                        source: new OlSourceOSM(),
                    });
                } else {
                    return new OlLayerImage();
                }
            case 'countries': // tslint:disable-line:no-switch-case-fall-through <-- BUG
                return new OlLayerVector({
                    source: new OlSourceVector({
                        url: 'assets/countries.geo.json',
                        format: new OlFormatGeoJSON(),
                    }),
                    style: (feature: ol.Feature, resolution: number): ol.style.Style => {
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
                const hostedSource = new OlSourceTileWMS({
                    url: this.config.MAP.HOSTED_BACKGROUND_SERVICE,
                    params: {
                        layers: this.config.MAP.HOSTED_BACKGROUND_LAYER_NAME,
                        projection: projection.getCode(),
                        version: this.config.MAP.HOSTED_BACKGROUND_SERVICE_VERSION,
                    },
                    wrapX: false,
                    projection: projection.getCode(),
                });
                const hostedLayer = new OlLayerTile({
                    source: hostedSource,
                });
                return hostedLayer;
            default:
                throw Error('Unknown Background Layer Name');
        }
    }

    public startDrawInteraction(drawType: ol.geom.GeometryType) {
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

        this.map.addLayer(this.drawInteractionLayer);
        this.map.addInteraction(this.drawInteraction);
    }

    public isDrawInteractionAttached(): boolean {
        return (!!this.drawInteraction && !!this.drawInteractionLayer);
    }

    public endDrawInteraction(): ol.source.Vector {
        if (!this.drawInteraction || ! this.drawInteractionLayer ) {
            console.error('no interaction or layer active!');
            return undefined;
        }

        const source = this.drawInteractionLayer.getSource();
        this.map.removeInteraction(this.drawInteraction);
        this.map.removeLayer(this.drawInteractionLayer);
        this.drawInteractionLayer = undefined;
        this.drawInteraction = undefined;

        return source;
    }
}
