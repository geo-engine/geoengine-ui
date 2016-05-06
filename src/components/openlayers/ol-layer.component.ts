import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from "angular2/core";
import ol from "openlayers";

import Config from "../../models/config.model";
import {Layer} from "../../models/layer.model";
import {Projection} from "../../models/projection.model";
import {Symbology, AbstractVectorSymbology, RasterSymbology} from "../../models/symbology.model";

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
export abstract class OlMapLayerComponent implements OnChanges {

    @Input() layer: Layer;
    @Input() projection: Projection;
    @Input() symbology: Symbology;

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
export class OlPointLayerComponent extends OlMapLayerComponent {
    protected source: ol.source.Vector;
    protected mapLayer: ol.layer.Vector;

    getMapLayer(): ol.layer.Vector {
        return this.mapLayer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        // console.log("point layer changes", changes);
        let params = this.layer.getParams(this.projection);
        let olStyle: any = (<AbstractVectorSymbology>this.layer.symbology).olStyle; // TODO: generics?
        // console.log("style", olStyle

        if (changes["layer"] || changes["projection"]) {
            this.source = new ol.source.Vector({
                format: new ol.format.GeoJSON(),
                url: Config.MAPPING_URL + "?" + Object.keys(params).map(
                    key => key + "=" + encodeURIComponent(params[key])
                ).join("&") + `&outputFormat=${Config.WFS.FORMAT}`,
                wrapX: false
            });

            this.mapLayer = new ol.layer.Vector({
                source: this.source,
                style: olStyle,
            });
        }

        if (changes["symbology"]) {
          this.mapLayer.setStyle(olStyle);
        }
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
export class OlRasterLayerComponent extends OlMapLayerComponent {
    protected source: ol.source.TileWMS;
    protected mapLayer: ol.layer.Tile;

    getMapLayer(): ol.layer.Tile {
        return this.mapLayer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        let params = this.layer.getParams(this.projection);

        let rasterSymbology: RasterSymbology = <RasterSymbology> this.layer.symbology;
        if (changes["layer"] || changes["projection"]) {
            this.source = new ol.source.TileWMS({
                url: Config.MAPPING_URL,
                params: params,
                wrapX: false
            });

            this.mapLayer = new ol.layer.Tile({
                source: this.source,
                opacity: rasterSymbology.opacity
            });
        }

        if (changes["symbology"]) {
            this.mapLayer.setOpacity(rasterSymbology.opacity);
            // this.mapLayer.setHue(rasterSymbology.hue);
            // this.mapLayer.setSaturation(rasterSymbology.saturation);
        }
    }

    getExtent() {
        return this.mapLayer.getExtent();
    }
}
