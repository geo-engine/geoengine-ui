import {
    Component, Input, OnInit, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy,
} from '@angular/core';
import {Subscription} from 'rxjs/Rx';

import * as ol from 'openlayers';

import {Projection} from '../operators/projection.model';
import {
    Symbology, AbstractVectorSymbology, RasterSymbology
} from '../layers/symbology/symbology.model';

import {Layer, VectorLayer, RasterLayer, LayerData, VectorData, RasterData} from '../layers/layer.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {Time} from '../time/time.model';
import {Config} from '../config.service';
import {ProjectService} from '../project/project.service';
import {LoadingState} from '../project/loading-state.model';

/**
 * The `ol-layer` component represents a single layer object of openLayer 3.
 *
 * # Input Variables
 * * layerType
 * * url
 * * params
 * * style
 */
// @Component({
//     selector: 'wave-ol-layer',
//     template: '',
//     changeDetection: ChangeDetectionStrategy.OnPush,
// })
export abstract class OlMapLayerComponent<OlLayer extends ol.layer.Layer,
    OlSource extends ol.source.Source,
    S extends Symbology,
    L extends Layer<S>>
    implements OnChanges {

    // TODO: refactor

    @Input() layer: L;
    @Input() projection: Projection;
    @Input() symbology: S;
    @Input() time: Time;
    @Input() visible = true;

    protected _mapLayer: OlLayer;
    protected source: OlSource;

    constructor(protected projectService: ProjectService) {
    }

    get mapLayer(): OlLayer {
        return this._mapLayer;
    };

    abstract ngOnChanges(changes: { [propName: string]: SimpleChange }): void;

    abstract getExtent(): [number, number, number, number];

    protected isFirstChange(changes: { [propName: string]: SimpleChange }): boolean {
        for (const property in changes) {
            if (changes[property].isFirstChange()) {
                return true;
            }
        }
        return false;
    }
}

export abstract class OlVectorLayerComponent extends OlMapLayerComponent<ol.layer.Vector,
    ol.source.Vector,
    AbstractVectorSymbology,
    VectorLayer<AbstractVectorSymbology>> implements OnInit, OnChanges, OnDestroy {

    // @Input() data: GeoJsonFeatureCollection;

    private dataSubscription: Subscription;

    constructor(protected projectService: ProjectService) {
        super(projectService);
        this.source = new ol.source.Vector({wrapX: false});
        this._mapLayer = new ol.layer.Vector({
            source: this.source,
            updateWhileAnimating: true,
        });
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((x: VectorData) => {
            // console.log("OlVectorLayerComponent dataSub", x);
            this.source.clear(); // TODO: check if this is needed always...
            this.source.addFeatures(x.data);
        })
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        /*
         if (this.isFirstChange(changes) || changes['projection']) {
         if (this.dataSubscription) {
         this.dataSubscription.unsubscribe();
         }
         this.dataSubscription = this.layer.data.data$.subscribe(features => {

         });
         }
         */

        if (changes['visible']) {
            this.mapLayer.setVisible(this.visible);
        }

        if (changes['symbology']) {
            const olStyle = this.symbology.getOlStyle();
            if (olStyle instanceof ol.style.Style) {
                this.mapLayer.setStyle(olStyle as ol.style.Style);
            } else {
                this.mapLayer.setStyle(olStyle as ol.StyleFunction);
            }
        }

        /*
         if (changes['projection'] || changes['time']) {
         this.source.clear(); // TODO: check if this is needed always...
         }
         */
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
    inputs: ['layer', 'projection', 'symbology', 'time', 'visible'],
})
export class OlPointLayerComponent extends OlVectorLayerComponent {
    constructor(protected projectService: ProjectService) {
        super(projectService);
    }
}

@Component({
    selector: 'wave-ol-line-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlLineLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time', 'visible'],
})
export class OlLineLayerComponent extends OlVectorLayerComponent {
    constructor(protected projectService: ProjectService) {
        super(projectService);
    }
}

@Component({
    selector: 'wave-ol-polygon-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlPolygonLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time', 'visible'],
})
export class OlPolygonLayerComponent extends OlVectorLayerComponent {
    constructor(protected projectService: ProjectService) {
        super(projectService);
    }
}

@Component({
    selector: 'wave-ol-raster-layer',
    template: '',
    providers: [{provide: OlMapLayerComponent, useExisting: OlRasterLayerComponent}],
    changeDetection: ChangeDetectionStrategy.OnPush,
    inputs: ['layer', 'projection', 'symbology', 'time', 'visible'],
})
export class OlRasterLayerComponent extends OlMapLayerComponent<ol.layer.Tile, ol.source.TileWMS,
    RasterSymbology, RasterLayer<RasterSymbology>> implements OnChanges, OnInit {

    private dataSubscription: Subscription;

    constructor(protected projectService: ProjectService,
                protected mappingQueryService: MappingQueryService,
                private config: Config) {
        super(projectService);
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((x: RasterData) => {
            // console.log("OlRasterLayerComponent dataSub", x);

            if (!this.source || this.source.getProjection().getCode() !== x.projection.getCode()) {
                this.source = new ol.source.TileWMS({
                    url: x.data,
                    params: {
                        time: x._time.asRequestString()
                    },
                    projection: x.projection.getCode(),
                    wrapX: false,
                });
                this._mapLayer = new ol.layer.Tile({
                    source: this.source,
                    opacity: this.symbology.opacity,
                });
                // console.log("OlRasterLayerComponent dataSub new source", this.source);
            } else {
                this.source.updateParams({
                    time: x.time.asRequestString(),
                });
                if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
                    this.source.refresh();
                }
                // console.log("OlRasterLayerComponent dataSub update source", this.source);
            }
        });

        // TILE LOADING STATE
        let tilesPending = 0;

        this.source.on('tileloadstart', () => {
            tilesPending++;
            this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.LOADING);
        });
        this.source.on('tileloadend', () => {
            tilesPending--;
            if (tilesPending <= 0) {
                this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.OK);
            }
        });
        this.source.on('tileloaderror', () => {
            tilesPending--;
            this.projectService.changeRasterLayerDataStatus(this.layer, LoadingState.ERROR);
        });
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        /*
         const params = this.mappingQueryService.getWMSQueryParameters({
         operator: this.layer.operator,
         time: this.time,
         projection: this.projection,
         });

         if (this.isFirstChange(changes) || changes['projection']) {
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
         */

        if (this._mapLayer) {
            if (changes['visible']) {
                this._mapLayer.setVisible(this.visible);
            }

            /*
             if (changes['projection'] || changes['time']) {
             this.source.updateParams(params.asObject());

             if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
             this.source.refresh();
             }
             }
             */
            if (changes['symbology']) {
                this._mapLayer.setOpacity(this.symbology.opacity);
                // this._mapLayer.setHue(rasterSymbology.hue);
                // this._mapLayer.setSaturation(rasterSymbology.saturation);
            }
        }
    }

    getExtent() {
        return this._mapLayer.getExtent();
    }
}
