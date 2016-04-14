import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from "angular2/core";
import ol from "openlayers";

import Config from "../config.model";
import {ResultType} from "../models/operator.model";
import {Layer} from "../models/layer.model";
import {Projection} from "../models/projection.model";

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class MapLayerComponent implements OnChanges {

    @Input() layer: Layer;
    @Input() projection: Projection;

    abstract getMapLayer(): ol.layer.Layer;

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointLayerComponent extends MapLayerComponent {
    protected source: ol.source.Vector;
    protected mapLayer: ol.layer.Vector;

    getMapLayer(): ol.layer.Vector {
        return this.mapLayer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        // console.log("point layer changes", changes);

        let params = this.layer.getParams(this.projection);
        let style: any = this.layer.style;

        this.source = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: Config.MAPPING_URL + "?" + Object.keys(params).map(
                key => key + "=" + encodeURIComponent(params[key])
            ).join("&") + "&format=geojson",
            wrapX: false
        });

        this.mapLayer = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: style.color }),
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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterLayerComponent extends MapLayerComponent {
    protected source: ol.source.TileWMS;
    protected mapLayer: ol.layer.Tile;

    getMapLayer(): ol.layer.Tile {
        return this.mapLayer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        let params = this.layer.getParams(this.projection);
        let style: any = this.layer.style;

        this.source = new ol.source.TileWMS({
            url: Config.MAPPING_URL,
            params: params,
            wrapX: false
        });

        this.mapLayer = new ol.layer.Tile({
            source: this.source,
            opacity: style.opacity
        });
    }

    getExtent() {
        return this.mapLayer.getExtent();
    }
}
