import {Component, ViewChild, ElementRef, Input, AfterViewInit, SimpleChange, OnChanges,
        ContentChildren, QueryList, AfterViewChecked, ChangeDetectionStrategy, AfterContentInit,
    } from '@angular/core';
import * as ol from 'openlayers';

import {OlMapLayerComponent} from './map-layer.component';

import {Projection, Projections} from '../operators/projection.model';
import {Symbology, AbstractVectorSymbology} from '../layers/symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {LayerService} from '../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {MapService} from './map.service';
import {Config} from '../config.service';

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
export class MapComponent implements AfterViewInit, AfterViewChecked, OnChanges, AfterContentInit {

    @Input() projection: Projection;

    @Input() height: number;

    @ViewChild('mapContainer') mapContainer: ElementRef;

    @ContentChildren(OlMapLayerComponent) contentChildren: QueryList<
        OlMapLayerComponent<ol.layer.Layer, ol.source.Source, Symbology, Layer<Symbology>>
    >;

    private map: ol.Map;

    private isSizeChanged = false;
    private isProjectionChanged = false;

    private _layers: Array<Layer<Symbology>> = []; // HACK

    constructor(
        private config: Config,
        private mapService: MapService,
        private layerService: LayerService,
        private projectService: ProjectService
    ) {
        this.initOpenlayersMap();

    }

    /**
     * Notify the map that the viewport has resized.
     */
    resize() {
        // will be set to false after view checked event
        // this.isSizeChanged = true;
        setTimeout(() =>  this.map.updateSize(), 0);
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
        this.map.getView().fit(extent, this.map.getSize());
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        console.log('map changes', changes, this);

        for (let propName in changes) {
            switch (propName) {
                case 'height':
                    this.isSizeChanged = true;
                    break;
                case 'projection':
                    this.isProjectionChanged = true;
                    break;
                default:
                    break;
            }
        }
    }

    ngAfterContentInit() {
        this.contentChildren.forEach(
            layerComponent => this.map.addLayer(layerComponent.mapLayer)
        );

        this.contentChildren.changes.subscribe(x => {
            // react on changes by removing all layers and inserting them
            // in the correct order.
            this.map.getLayers().clear();
            this.map.getLayers().push(this.createBackgroundLayer(this.projection));
            this.contentChildren.forEach(
                layerComponent => this.map.getLayers().push(layerComponent.mapLayer)
            );
        });

        // Hack: querylist ignores order changes
        this.projectService.getLayerStream().subscribe(x => {
            if (this._layers === x) { return; }

            let change = this._layers.length !== x.length;

            for (let i = 0; i < this._layers.length; i++) {
                if (this._layers[i] !== x[i]) {
                    change = true;
                    break;
                }
            }
            if (change) {
                this.contentChildren.setDirty();
                this._layers = x.slice(0);
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
        this.map.set('layers', [this.createBackgroundLayer(this.projection)]);

        const view = new ol.View({
            projection: this.projection.getOpenlayersProjection(),
            center: [0, 0],
            zoom: 2,
        });

        this.map.setView(view);

        // get resolution changes
        this.mapService.setViewportSize({
            extent: this.map.getView().calculateExtent(this.map.getSize()),
            resolution: this.map.getView().getResolution(),
            maxExtent: this.projection.getExtent(),
        });

        view.on('change:resolution', () => {
            // remove selected features on resolution change
            this.layerService.updateSelectedFeatures(
                [],
                this.layerService.getSelectedFeatures().selected.toArray()
            );

            // console.log('ngAfterViewInit', 'change:resolution', view.calculateExtent(this.map.getSize()));
            this.mapService.setViewportSize({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                resolution: this.map.getView().getResolution(),
                maxExtent: this.projection.getExtent(),
            });
        });

        this.map.on('moveend', event => {
            // console.log('ngAfterViewInit', 'moveend', this.map.getView().calculateExtent(this.map.getSize()));

            this.mapService.setViewportSize({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                resolution: this.map.getView().getResolution(),
                maxExtent: this.projection.getExtent(),
            });
        });
    }

    ngAfterViewChecked() {
        if (this.isProjectionChanged) {
            const oldProjection = this.map.getView().getProjection();
            const newProjection = this.projection.getOpenlayersProjection();
            const oldCenterPoint = new ol.geom.Point(this.map.getView().getCenter());
            const newCenterPoint = oldCenterPoint.clone().transform(
                oldProjection, newProjection
            ) as ol.geom.Point;

            const view = new ol.View({
                projection: this.projection.getOpenlayersProjection(),
                center: newCenterPoint.getCoordinates(),
                zoom: this.map.getView().getZoom(),
            });
            this.map.setView(view);

            // get resolution changes
            this.mapService.setViewportSize({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                resolution: this.map.getView().getResolution(),
                maxExtent: this.projection.getExtent(),
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
                    maxExtent: this.projection.getExtent(),
                });
            });

            this.map.getLayers().clear();
            this.map.getLayers().push(this.createBackgroundLayer(this.projection));
            this.contentChildren.forEach(
                layerComponent => this.map.addLayer(layerComponent.mapLayer)
            );

            this.isProjectionChanged = false;
        }
        if (this.isSizeChanged) {
            this.map.updateSize();
            this.isSizeChanged = false;
        }
    }

    private initOpenlayersMap() {
        this.map = new ol.Map({
            controls: [],
            logo: false,
            loadTilesWhileAnimating: true,  // TODO: check if moved to layer
            loadTilesWhileInteracting: true, // TODO: check if moved to layer
        });

        let selectedOlLayers: Array<ol.layer.Layer> = undefined;

        // add the select interaction to the map
        const select = new ol.interaction.Select({
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
                    if (highlightStyle instanceof ol.style.Style) {
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

            let newSelect = new ol.Collection<ol.Feature>();
            //SEITENEFFEKT SORGTE DAFÜR, DASS NUR JEDES ZWEITE ITEM DER REMOVE-LIST GELÖSCHT WURDE!
            select.getFeatures().forEach(feature => {
                if (selected.remove && selected.remove.contains(feature.getId())) {
                    newSelect.push(feature);
                    feature.setStyle(undefined);
                }
            });

            newSelect.forEach(feature => {
                select.getFeatures().remove(feature);
            });

            if ( selectedOlLayers ) {
                selectedOlLayers.forEach(layer => {
                    if (layer instanceof ol.layer.Vector) {
                        const vectorLayer = layer as ol.layer.Vector;
                        vectorLayer.getSource().getFeatures().forEach(feature => {
                            if (selected.add && selected.add.contains(feature.getId())) {
                                if ( select.getFeatures().getArray().indexOf(feature) === -1) {
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

    private createBackgroundLayer(projection: Projection): ol.layer.Image {
        switch (this.config.MAP.BACKGROUND_LAYER) {
            case 'OSM':
                if (projection === Projections.WEB_MERCATOR) {
                    return new ol.layer.Tile({
                        source: new ol.source.OSM(),
                    });
                } else {
                    return new ol.layer.Image();
                }
            case 'countries': // tslint:disable-line:no-switch-case-fall-through <-- BUG
                return new ol.layer.Vector({
                    source: new ol.source.Vector({
                        url: 'assets/countries.geo.json',
                        format: new ol.format.GeoJSON(),
                    }),
                    style: (feature: ol.Feature, resolution: number): ol.style.Style => {
                        if (feature.getId() === 'BACKGROUND') {
                            return new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: '#ADD8E6',
                                }),
                            });
                        } else {
                            return new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 0, 1)',
                                    width: 1,
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(210, 180, 140, 1)',
                                }),
                            });
                        }
                    },
                });
            case 'hosted':
                const hostedSource = new ol.source.TileWMS({
                    url: this.config.MAP.HOSTED_BACKGROUND_SERVICE,
                    params: {
                        layers: this.config.MAP.HOSTED_BACKGROUND_LAYER_NAME,
                        projection: projection.getCode(),
                        version: this.config.MAP.HOSTED_BACKGROUND_SERVICE_VERSION,
                    },
                    wrapX: false,
                    projection: projection.getCode(),
                });
                const hostedLayer = new ol.layer.Tile({
                    source: hostedSource,
                });
                return hostedLayer;
            default:
                throw Error('Unknown Background Layer Name');
        }
    }
}
