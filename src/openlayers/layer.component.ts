import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from "angular2/core";
import ol from "openlayers";

import Config from "../config.model";
import {ResultType} from "../models/operator.model";

/**
 * The `ol-layer` component represents a single layer object of openLayer 3.
 *
 * # Input Variables
 * * layerType
 * * url
 * * params
 * * style
 */
@Component({
    selector: "ol-layer",
    template: "",
    changeDetection: ChangeDetectionStrategy.Detached
})
export abstract class MapLayerComponent implements OnChanges {

    @Input()
    protected params: any;

    @Input()
    protected style: any;

    abstract getLayer(): ol.layer.Layer;

    protected isFirstChange(changes: { [propName: string]: SimpleChange }): boolean {
        for (let property in changes) {
            if (changes[property].isFirstChange()) {
                return true;
            }
        }
        return false;
    }

    abstract ngOnChanges(changes: { [propName: string]: SimpleChange }): void;

    abstract getExtent(): number[];

}

@Component({
    selector: "ol-point-layer",
    template: "",
    changeDetection: ChangeDetectionStrategy.Detached
})
export class PointLayerComponent extends MapLayerComponent {
    protected source: ol.source.Vector;
    protected layer: ol.layer.Vector;

    getLayer(): ol.layer.Vector {
        return this.layer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        if (!this.isFirstChange(changes)) {
            return; // TODO: react on changes
        }

//        console.log("point layer");

        this.source = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: Config.MAPPING_URL + "?" + Object.keys(this.params).map(
                key => key + "=" + encodeURIComponent(this.params[key])
            ).join("&") + "&format=geojson",
            wrapX: false
        });

        this.layer = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: this.style.color }),
                    stroke: new ol.style.Stroke({ color: "#000000", width: 1 })
                })
            })
        });
    }

    getExtent() {
        return this.source.getExtent();
    }
}

@Component({
    selector: "ol-raster-layer",
    template: "",
    changeDetection: ChangeDetectionStrategy.Detached
})
export class RasterLayerComponent extends MapLayerComponent {
    protected source: ol.source.TileWMS;
    protected layer: ol.layer.Tile;

    getLayer(): ol.layer.Tile {
        return this.layer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        if (!this.isFirstChange(changes)) {
            return; // TODO: react on changes
        }

//        console.log("raster layer");

        this.source = new ol.source.TileWMS({
            url: Config.MAPPING_URL,
            params: this.params,
            wrapX: false
        });

        this.layer = new ol.layer.Tile({
            source: this.source,
            opacity: this.style.opacity
        });
    }

    getExtent() {
        return this.layer.getExtent();
    }
}
