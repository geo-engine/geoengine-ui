import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from 'angular2/core';
import ol from 'openlayers';

import Config from '../../models/config.model';
import {Operator} from '../../operators/operator.model';
import {Projection} from '../../operators/projection.model';
import {Symbology, AbstractVectorSymbology, RasterSymbology, SimplePointSymbology} from '../../models/symbology.model';
import {GeoJsonFeatureCollection} from '../../models/geojson.model';

import {MappingQueryService, WFSOutputFormats} from '../../services/mapping-query.service';

import moment from 'moment';

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
    selector: 'ol-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class OlMapLayerComponent<OlLayer extends ol.layer.Layer,
                                          OlSource extends ol.source.Source,
                                          S extends Symbology> implements OnChanges {

    @Input() operator: Operator;
    @Input() projection: Projection;
    @Input() symbology: S;
    @Input() time: moment.Moment;
    @Input() data: GeoJsonFeatureCollection; // FIXME: HACK: this should be inside OlVectorLayerComponent!!!

    protected _mapLayer: OlLayer;
    protected source: OlSource;

    constructor(protected mappingQueryService: MappingQueryService) {}

    get mapLayer(): OlLayer { return this._mapLayer; };

    abstract ngOnChanges(changes: { [propName: string]: SimpleChange }): void;

    abstract get extent(): number[];

    protected isFirstChange(changes: { [propName: string]: SimpleChange }): boolean {
        for (const property in changes) {
            if (changes[property].isFirstChange()) {
                return true;
            }
        }
        return false;
    }
}

abstract class OlVectorLayerComponent
    extends OlMapLayerComponent<ol.layer.Vector, ol.source.Vector, AbstractVectorSymbology>
    implements OnChanges {

    // @Input() data: GeoJsonFeatureCollection;
    private format = new ol.format.GeoJSON();

    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
        this.source = new ol.source.Vector();
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        /*
        if (changes['operator'] || changes['projection'] || changes['time'] || changes['data']) {
            this.source = new ol.source.Vector({
                format: new ol.format.GeoJSON(),
                url: this.mappingQueryService.getWFSQueryUrl(
                    this.operator,
                    this.time,
                    this.projection,
                    WFSOutputFormats.JSON
                ),
                wrapX: false,
            });
        }
        */

            if (this.isFirstChange(changes)) {
                this._mapLayer = new ol.layer.Vector({
                    source: this.source,
                    style: this.symbology.olStyle,
                });
            }

            if (changes['operator'] || changes['projection'] || changes['time'] || changes['data']) {
                this.mapLayer.getSource().clear();
            }

            if( changes['data'] ) {
                if (this.data) {
                    console.log('data', this.data);
                    this.mapLayer.getSource().addFeatures(this.format.readFeatures(this.data));
                }
            }

            if (changes['symbology']) {
                this.mapLayer.setStyle(this.symbology.olStyle);
            }
    }

    get extent() {
        return this.source.getExtent();
    }
}

@Component({
    selector: 'ol-point-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPointLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'ol-line-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlLineLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'ol-polygon-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPolygonLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'ol-raster-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlRasterLayerComponent
    extends OlMapLayerComponent<ol.layer.Tile, ol.source.TileWMS, RasterSymbology>
    implements OnChanges {

    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        if (this.isFirstChange(changes)) {
            this.source = new ol.source.TileWMS({
                url: Config.MAPPING_URL,
                params: this.mappingQueryService.getWMSQueryParameters(
                    this.operator,
                    this.time,
                    this.projection
                ),
                wrapX: false,
            });

            this._mapLayer = new ol.layer.Tile({
                source: this.source,
                opacity: this.symbology.opacity,
            });
        } else {
            if (changes['operator'] || changes['projection'] || changes['time']) {
                // TODO: add these functions to the typings file.
                (this.source as any).updateParams(
                    this.mappingQueryService.getWMSQueryParameters(
                        this.operator,
                        this.time,
                        this.projection
                    )
                );
                (this.source as any).refresh();
            }
            if (changes['symbology']) {
                this._mapLayer.setOpacity(this.symbology.opacity);
                // this._mapLayer.setHue(rasterSymbology.hue);
                // this._mapLayer.setSaturation(rasterSymbology.saturation);
            }
        }
    }

    get extent() {
        return this._mapLayer.getExtent();
    }
}
