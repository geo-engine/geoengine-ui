import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange} from '@angular/core';
import {Subscription} from 'rxjs/Rx';

import ol from 'ol';
import OlStyleStyle from 'ol/style/style';
import OlLayerTile from 'ol/layer/tile';
import OlSourceTileWMS from 'ol/source/tilewms';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';


import {Projection} from '../operators/projection.model';
import {AbstractVectorSymbology, MappingColorizerRasterSymbology, Symbology} from '../layers/symbology/symbology.model';

import {StyleCreator} from './style-creator';
import {Layer, RasterData, RasterLayer, VectorData, VectorLayer} from '../layers/layer.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {Time} from '../time/time.model';
import {Config} from '../config.service';
import {ProjectService} from '../project/project.service';
import {LoadingState} from '../project/loading-state.model';
import {isNullOrUndefined} from 'util';

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
export abstract class OlMapLayerComponent<
        OL extends ol.layer.Layer,
        OS extends ol.source.Source,
        S extends Symbology,
        L extends Layer<S>
    >
    implements OnChanges {

    // TODO: refactor

    @Input() layer: L;
    @Input() projection: Projection;
    @Input() symbology: S;
    @Input() time: Time;
    @Input() visible = true;
    protected source: OS;

    protected _mapLayer: OL;

    protected constructor(protected projectService: ProjectService) {
    }

    get mapLayer(): OL {
        return this._mapLayer;
    };

    abstract ngOnChanges(changes: { [propName: string]: SimpleChange }): void;

    abstract getExtent(): [number, number, number, number];
}

export abstract class OlVectorLayerComponent extends OlMapLayerComponent<ol.layer.Vector,
    ol.source.Vector,
    AbstractVectorSymbology,
    VectorLayer<AbstractVectorSymbology>> implements OnInit, OnChanges, OnDestroy {

    // @Input() data: GeoJsonFeatureCollection;

    private dataSubscription: Subscription;

    protected constructor(protected projectService: ProjectService) {
        super(projectService);
        this.source = new OlSourceVector({wrapX: false});
        this._mapLayer = new OlLayerVector({
            source: this.source,
            updateWhileAnimating: true,
        });
    }

    ngOnInit() {
        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((x: VectorData) => {
            // console.log("OlVectorLayerComponent dataSub", x);
            this.source.clear(); // TODO: check if this is needed always...
            if (!isNullOrUndefined(x)) {
                this.source.addFeatures(x.data);
            }
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
            /*const style = this.symbology.getOlStyle();
            if (style instanceof OlStyleStyle) {
                this.mapLayer.setStyle(style as ol.style.Style);
            } else {
                this.mapLayer.setStyle(style as ol.StyleFunction);
            }
            */
            const style = StyleCreator.fromVectorSymbology(this.symbology);
            this.mapLayer.setStyle(style);
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
    MappingColorizerRasterSymbology, RasterLayer<MappingColorizerRasterSymbology>> implements OnChanges, OnInit {

    private dataSubscription: Subscription;

    constructor(protected projectService: ProjectService,
                protected mappingQueryService: MappingQueryService,
                private config: Config) {
        super(projectService);
    }

    ngOnInit() {
        // closure variables for checking the old state
        let data = undefined;
        let time = undefined;

        this.dataSubscription = this.projectService.getLayerDataStream(this.layer).subscribe((rasterData: RasterData) => {
            if (isNullOrUndefined(rasterData)) {
                // console.log("OlRasterLayerComponent constructor", rasterData);
                return;
            }

            if (this.source) {
                if (time !== rasterData.time.asRequestString()) {
                    // console.log("time", time, rasterData.time.asRequestString());

                    this.source.updateParams({
                        time: rasterData.time.asRequestString(),
                        colors: this.symbology.mappingColorizerRequestString()
                    });
                    time = rasterData.time.asRequestString();
                }
                if (this.source.getProjection().getCode() !== rasterData.projection.getCode()) {
                    // console.log("projection", this.source.getProjection().getCode, rasterData.projection.getCode());

                    // unfortunally there is no setProjection function, so reset the whole source
                    this.source = new OlSourceTileWMS({
                        url: rasterData.data,
                        params: {
                            time: rasterData.time.asRequestString(),
                            colors: this.symbology.mappingColorizerRequestString()
                        },
                        projection: rasterData.projection.getCode(),
                        wrapX: false,
                    });

                    if (this._mapLayer) {
                        this._mapLayer.setSource(this.source);
                    }
                }
                if (data !== rasterData.data) {
                    // console.log("data", data, rasterData.data);

                    this.source.setUrl(rasterData.data);
                    data = rasterData.data;
                }

                if (this.config.MAP.REFRESH_LAYERS_ON_CHANGE) {
                    this.source.refresh();
                }
            } else {
                this.source = new OlSourceTileWMS({
                    url: rasterData.data,
                    params: {
                        time: rasterData.time.asRequestString(),
                        colors: this.symbology.mappingColorizerRequestString()
                    },
                    projection: rasterData.projection.getCode(),
                    wrapX: false,
                });
                data = rasterData.data;
                time = rasterData.time.asRequestString();
            }

            if (this._mapLayer) {
                this._mapLayer.setSource(this.source);
            } else {
                this._mapLayer = new OlLayerTile({
                    source: this.source,
                    opacity: this.symbology.opacity,
                });
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
        // console.log("RasterMapLayer", "ngOnChanges", changes);
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
                this.source.updateParams({
                    colors: this.symbology.mappingColorizerRequestString()
                })
            }
        }
    }

    getExtent() {
        return this._mapLayer.getExtent();
    }
}
