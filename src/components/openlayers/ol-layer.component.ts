import {
    Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy, provide,
} from '@angular/core';
import {Subscription} from 'rxjs/Rx';

import ol from 'openlayers';
import moment from 'moment';

import Config from '../../models/config.model';
import {Projection} from '../../operators/projection.model';
import {Symbology, AbstractVectorSymbology, RasterSymbology}
    from '../../symbology/symbology.model';

import {Layer, VectorLayer, RasterLayer} from '../../models/layer.model';
import {MappingQueryService} from '../../services/mapping-query.service';

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
    @Input() time: moment.Moment;

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
    extends OlMapLayerComponent<ol.layer.Vector, ol.source.Vector,
        AbstractVectorSymbology, VectorLayer<AbstractVectorSymbology>>
    implements OnChanges, OnDestroy {

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

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
            if ( this.isFirstChange(changes) ) {
                this.dataSubscription = this.layer.data$.subscribe(data => {
                    this.source.clear(); // TODO: check if this is needed always...
                    this.source.addFeatures(this.format.readFeatures(data as any));
                });
            }

            if (changes['symbology']) {
                this.mapLayer.setStyle(this.symbology.olStyle);
            }
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    get extent() {
        return this.source.getExtent();
    }
}

@Component({
    selector: 'wave-ol-point-layer',
    template: '',
    providers: [provide(OlMapLayerComponent, {useExisting: OlPointLayerComponent})],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPointLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-line-layer',
    template: '',
    providers: [provide(OlMapLayerComponent, {useExisting: OlLineLayerComponent})],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlLineLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-polygon-layer',
    template: '',
    providers: [provide(OlMapLayerComponent, {useExisting: OlPolygonLayerComponent})],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlPolygonLayerComponent extends OlVectorLayerComponent {
    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }
}

@Component({
    selector: 'wave-ol-raster-layer',
    template: '',
    providers: [provide(OlMapLayerComponent, {useExisting: OlRasterLayerComponent})],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlRasterLayerComponent
    extends OlMapLayerComponent<ol.layer.Tile, ol.source.TileWMS,
        RasterSymbology, RasterLayer<RasterSymbology>>
    implements OnChanges {

    constructor(protected mappingQueryService: MappingQueryService) {
        super(mappingQueryService);
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        const params = this.mappingQueryService.getWMSQueryParameters(
            this.layer.operator,
            this.time,
            this.projection
        );
        if (this.isFirstChange(changes)) {
            this.source = new ol.source.TileWMS({
                url: Config.MAPPING_URL,
                params: params,
                wrapX: false,
            });
            this._mapLayer = new ol.layer.Tile({
                source: this.source,
                opacity: this.symbology.opacity,
            });
        }

        if (changes['projection'] || changes['time']) {
            // TODO: add these functions to the typings file.
            (this.source as any).updateParams(params);
            // (this.source as any).refresh();
        }
        if (changes['symbology']) {
            this._mapLayer.setOpacity(this.symbology.opacity);
            // this._mapLayer.setHue(rasterSymbology.hue);
            // this._mapLayer.setSaturation(rasterSymbology.saturation);
        }
    }

    get extent() {
        return this._mapLayer.getExtent();
    }
}
