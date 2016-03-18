import {Component, ViewChild, ElementRef, Input,
    AfterViewInit, SimpleChange,
    ContentChildren, QueryList, AfterViewChecked,
    ChangeDetectionStrategy} from "angular2/core";
import ol from "openlayers";
import {MapLayerComponent, PointLayerComponent, RasterLayerComponent} from "./layer.component";


/**
 * The `ol-map` component represents an openLayers 3 map component.
 * it supports `ol-layer` components as child components.
 */
@Component({
    selector: "ol-map",
    template: `
    <div #mapContainer style="background: black;"
         [style.height.px]="height">
    </div>
    <ng-content></ng-content>
    `,
    styleUrls: [
//        "node_modules/openlayers/css/ol.css"
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements AfterViewInit, AfterViewChecked {

    private map: ol.Map;

    @ViewChild("mapContainer")
    private mapContainer: ElementRef;

    /*
    @Input("width")
    private _width: string | number;
    */

    @Input("height")
    private height: number;

    @ContentChildren("olLayer")
    private layers: QueryList<MapLayerComponent>;

    private isSizeChanged = false;

    /**
     * Notify the map that the viewport has resized.
     */
    resize() {
        // will be set to false after view checked event
        this.isSizeChanged = true;
    }

    ngAfterViewInit() {
        let backgroundLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        this.map = new ol.Map({
            target: this.mapContainer.nativeElement,
            layers: [backgroundLayer],
            view: new ol.View({
                projection: "EPSG:3857",
                center: [0, 0],
                zoom: 2
            }),
            controls: [],
            logo: false
        });

        // this.layers.forEach(layer => console.log("added", layer));

        // initialize layers
        this.layers.forEach(
            (layerComponent: MapLayerComponent) => this.map.addLayer(layerComponent.getLayer())
        );

        this.layers.changes.subscribe(_ => {
            // react on changes by removing all layers and inserting them
            // in the correct order.

            this.map.getLayers().clear();
            this.map.getLayers().push(backgroundLayer);
            this.layers.forEach(
                (layerComponent: MapLayerComponent) => this.map.getLayers().push(layerComponent.getLayer())
            );
        });
    }

    ngAfterViewChecked() {
        if (this.isSizeChanged) {
            this.map.updateSize();
            this.isSizeChanged = false;
        }
    }

    zoomIn() {
        let zoomLevel = this.map.getView().getZoom();
        this.map.getView().setZoom(zoomLevel + 1);
    }

    zoomOut() {
        let zoomLevel = this.map.getView().getZoom();
        this.map.getView().setZoom(zoomLevel - 1);
    }

    zoomToMap() {
//        console.log("zoomToMap");
        let extent = this.map.getView().getProjection().getExtent();
        this.map.getView().fit(extent, this.map.getSize());
    }

    zoomToLayer(layerIndex: number) {
        let layer = this.layers.toArray()[layerIndex];

        let extent = layer.getExtent();

        if (extent === undefined) {
            this.zoomToMap();
        } else {
            this.map.getView().fit(
                extent,
                this.map.getSize()
            );
        }
    }

}
