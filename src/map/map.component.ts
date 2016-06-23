import {Component, ViewChild, ElementRef, Input, AfterViewInit, SimpleChange, OnChanges,
        ContentChildren, QueryList, AfterViewChecked, ChangeDetectionStrategy, AfterContentInit,
    } from '@angular/core';
import ol from 'openlayers';

import {OlMapLayerComponent} from './map-layer.component';

import {Projection, Projections} from '../operators/projection.model';
import {Symbology} from '../symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {LayerService} from '../layers/layer.service';
import {MapService} from './map.service';

/**
 * The `ol-map` component represents an openLayers 3 map component.
 * it supports `ol-layer` components as child components.
 */
@Component({
    selector: 'wave-ol-map',
    template: `
    <div #mapContainer style='background: black;'
         [style.height.px]='height'>
    </div>
    <ng-content></ng-content>
    `,
    styleUrls: [
//        'node_modules/openlayers/css/ol.css'
    ],
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
        private mapService: MapService,
        private layerService: LayerService
    ) {
        this.initOpenlayersMap();
    }

    /**
     * Notify the map that the viewport has resized.
     */
    resize() {
        // will be set to false after view checked event
        this.isSizeChanged = true;
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
        this.map.getView().fit(extent, this.map.getSize());
    }

    zoomToLayer(layerIndex: number) {
        const layer = this.contentChildren.toArray()[layerIndex];

        const extent = layer.extent;

        if (extent === undefined) {
            this.zoomToMap();
        } else {
            this.map.getView().fit(
                extent,
                this.map.getSize()
            );
        }
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        // console.log('map changes', changes, this);

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
        this.layerService.getLayersStream().subscribe(x => {
            if (this._layers === x) { return; };

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
            // extent: view.calculateExtent(this.map.getSize()),
            extent: this.projection.getExtent(),
            resolution: view.getResolution(),
        });

        view.on('change:resolution', () => {
            this.mapService.setViewportSize({
                // extent: view.calculateExtent(this.map.getSize()),
                extent: this.projection.getExtent(),
                resolution: view.getResolution(),
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

            // console.log(
            //     'oldcenter:', oldCenterPoint.getCoordinates(),
            //     'newcenter:', newCenterPoint.getCoordinates()
            // );

            const view = new ol.View({
                projection: this.projection.getOpenlayersProjection(),
                center: newCenterPoint.getCoordinates(),
                zoom: this.map.getView().getZoom(),
            });
            this.map.setView(view);

            // get resolution changes
            this.mapService.setViewportSize({
                // extent: view.calculateExtent(this.map.getSize()),
                extent: this.projection.getExtent(),
                resolution: view.getResolution(),
            });

            view.on('change:resolution', () => {
                this.mapService.setViewportSize({
                    // extent: view.calculateExtent(this.map.getSize()),
                    extent: this.projection.getExtent(),
                    resolution: view.getResolution(),
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
        });
        (select as any).setActive(false);
        this.map.addInteraction(select);
        select.on(['select'], (event: any) => {
            const selectEvent = event as ol.SelectEvent;
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
            select.getFeatures().clear();
            if (layer && select) {
                selectedOlLayers = this.contentChildren.filter(
                    olLayerComponent => olLayerComponent.layer === layer
                ).map(
                    olLayerComponent => olLayerComponent.mapLayer
                );
                (select as any).setActive(true);
            } else {
                (select as any).setActive(false);
            }
        });
    }

    private createBackgroundLayer(projection: Projection): ol.layer.Image {
        // TODO: more layers
        if (projection === Projections.WEB_MERCATOR) {
            return new ol.layer.Tile({
                source: new ol.source.OSM(),
            });
        } else {
            return new ol.layer.Image();
        }
    }
}
