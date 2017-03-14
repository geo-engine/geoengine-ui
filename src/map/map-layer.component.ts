import {
    Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy,
} from '@angular/core';
import {Subscription} from 'rxjs/Rx';

import * as ol from 'openlayers';

import {Projection} from '../app/operators/projection.model';
import {
    Symbology, AbstractVectorSymbology, RasterSymbology
} from '../symbology/symbology.model';

import {Layer, VectorLayer, RasterLayer} from '../layers/layer.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {Time} from '../app/time.model';
import {Config} from '../app/config.service';

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
    selector: 'wave-ol-layer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class OlMapLayerComponent<OlLayer extends ol.layer.Layer,
    OlSource extends ol.source.Source,
    S extends Symbology,
    L extends Layer<S>> implements OnChanges {

    @Input() layer: L;
    @Input() projection: Projection;
    @Input() symbology: S;
    @Input() time: Time;

    protected _mapLayer: OlLayer;
    protected source: OlSource;

    constructor(protected mappingQueryService: MappingQueryService) {
    }

    get mapLayer(): OlLayer {
        return this._mapLayer;
    };

    abstract ngOnChanges(changes: {[propName: string]: SimpleChange}): void;

    abstract getExtent(): [number, number, number, number];

    protected isFirstChange(changes: {[propName: string]: SimpleChange}): boolean {
        for (const property in changes) {
            if (changes[property].isFirstChange()) {
                return true;
            }
        }
        return false;
    }
}

abstract class OlVectorLayerComponent extends OlMapLayerComponent<ol.layer.Vector, ol.source.Vector,
    AbstractVectorSymbology, VectorLayer<AbstractVectorSymbology>> implements OnChanges, OnDestroy {

    // @Input() data: GeoJsonFeatureCollection;
    private format = new ol.format.GeoJSON();
    private dataSubscription: Subscription;

    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
        this.source = new ol.source.Vector({wrapX: false});
        this._mapLayer = new ol.layer.Vector({
            source: this.source,
            updateWhileAnimating: true,
        });
    }

    ngOnChanges(changes: {[propName: string]: SimpleChange}) {
        if (this.isFirstChange(changes)) {
            this.dataSubscription = this.layer.data.data$.subscribe(data => {
                this.source.clear(); // TODO: check if this is needed always...
                this.source.addFeatures(this.format.readFeatures(data));
            });
        }

        if (changes['symbology']) {
            const olStyle = this.symbology.getOlStyle();
            if (olStyle instanceof ol.style.Style) {
                this.mapLayer.setStyle(olStyle as ol.style.Style);
            } else {
                this.mapLayer.setStyle(olStyle as ol.StyleFunction);
            }
        }

        if (changes['projection'] || changes['time']) {
            this.source.clear(); // TODO: check if this is needed always...
        }
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    getExtent() {
        return this.source.getExtent();
    }
}

@Component({
    selector: 'wave-ol-point-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlPointLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time'],
})
export class OlPointLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-line-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlLineLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time'],
})
export class OlLineLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-polygon-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlPolygonLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time'],
})
export class OlPolygonLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-raster-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlRasterLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time'],
})
export class OlRasterLayerComponent extends OlMapLayerComponent<ol.layer.Tile, ol.source.TileWMS,
    RasterSymbology, RasterLayer<RasterSymbology>> implements OnChanges {

    constructor(protected mappingQueryService: MappingQueryService, private config: Config) {
        super(mappingQueryService);
    }

    ngOnChanges(changes: {[propName: string]: SimpleChange}) {

        const params = this.mappingQueryService.getWMSQueryParameters({
            operator: this.layer.operator,
            time: this.time,
            projection: this.projection,
        });
        console.log("OlRasterLayerComponent", changes, params);

        if (this.isFirstChange(changes)) {
            this.source = new ol.source.TileWMS({
                url: this.config.MAPPING_URL,
                params: params.asObject(),
                wrapX: false,
                projection: this.projection.getCode()
            });
            this._mapLayer = new ol.layer.Tile({
                source: this.source,
                opacity: this.symbology.opacity,
            });
        }

        if (changes['projection'] || changes['time']) {
            this.source.updateParams(params.asObject());
            if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
                this.source.refresh();
            }
        }
        if (changes['symbology']) {
            this._mapLayer.setOpacity(this.symbology.opacity);
            // this._mapLayer.setHue(rasterSymbology.hue);
            // this._mapLayer.setSaturation(rasterSymbology.saturation);
        }
    }

    getExtent() {
        return this._mapLayer.getExtent();
    }
}
