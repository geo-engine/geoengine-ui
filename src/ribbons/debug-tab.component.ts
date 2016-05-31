import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {LayerService} from '../layers/layer.service';
import {PlotService} from '../plots/plot.service';
import {ProjectService} from '../project/project.service';
import {MappingQueryService} from '../services/mapping-query.service';

import {VectorLayer, RasterLayer} from '../layers/layer.model';
import {Plot} from '../plots/plot.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType, DataTypes} from '../operators/datatype.model';
import {Projections} from '../operators/projection.model';
import {Unit, Interpolation} from '../operators/unit.model';
import {
    SimplePointSymbology, SimpleVectorSymbology, MappingColorizerRasterSymbology,
} from '../symbology/symbology.model';

import {RasterSourceType} from '../operators/types/raster-source-type.model';
import {GFBioSourceType} from '../operators/types/gfbio-source-type.model';
import {WKTSourceType} from '../operators/types/wkt-source-type.model';
import {HistogramType} from '../operators/types/histogram-type.model';
import {RScriptType} from '../operators/types/r-script-type.model';

/**
 * The start tab of the ribbons component.
 */
@Component({
    selector: 'wave-debug-tab',
    template: `
    <md-content layout="row">
        <fieldset>
            <legend>Add Layers</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column" layout-align="center center"
                            (click)="addAllLayers()">
                        <i md-icon>add_to_queue</i>
                        <div>All Types</div>
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addPointLayer()">
                        <i md-icon>add</i>
                        Points
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addLineLayer()">
                        <i md-icon>add</i>
                        Lines
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addPolygonLayer()">
                        <i md-icon>add</i>
                        Polygons
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addRasterLayer()">
                        <i md-icon>add</i>
                        Raster
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>Add Plots</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column" layout-align="center center"
                            (click)="addAllPlots()">
                        <i md-icon>add_to_queue</i>
                        <div>All Types</div>
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addHistogramPlot()">
                        <i md-icon>add</i>
                        Histogram
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addRPlotPlot()">
                        <i md-icon>add</i>
                        R Plot
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addRTextPlot()">
                        <i md-icon>add</i>
                        R Text
                    </button>
                    <button md-button class="spacer-button"></button>
                </div>
            </div>
        </fieldset>
    </md-content>
    `,
    styles: [`
    .selected {
      background-color: #f5f5f5 !important;
    }
    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
    }
    button[disabled] {
        background-color: transparent;
    }
    .spacer-button {
        width: 0px;
        min-width: 0px;
        padding: 0px;
        margin: 0px;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugTabComponent {
    constructor(
        private layerService: LayerService,
        private plotService: PlotService,
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService
    ) {}

    addPointLayer() {
        const gbifPumaOperator = new Operator({
            operatorType: new GFBioSourceType({
                datasource: 'GBIF',
                query: `{'globalAttributes':{'speciesName':'Puma concolor'},'localAttributes':{}}`,
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });

        this.layerService.addLayer(
            new VectorLayer({
                name: 'Puma Concolor',
                symbology: new SimplePointSymbology({fill_rgba: [244, 67, 54, 0.8]}),
                operator: gbifPumaOperator,
                data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                    gbifPumaOperator
                ),
                prov$: this.mappingQueryService.getProvenanceStream(gbifPumaOperator),
            })
        );
    }

    addLineLayer() {
        const wktOperator = new Operator({
            operatorType: new WKTSourceType({
                type: ResultTypes.LINES,
                wkt: 'GEOMETRYCOLLECTION(LINESTRING('
                        + '-65.3906249908975 24.046463996515854,'
                        + '47.812499993344474 57.04072983307594,'
                        + '55.8984374922189 -46.43785688998231,'
                        + '-65.3906249908975 24.046463996515854'
                        + '))',
            }),
            resultType: ResultTypes.LINES,
            projection: Projections.WGS_84,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });

        this.layerService.addLayer(
            new VectorLayer({
                name: 'WKT',
                symbology: new SimpleVectorSymbology({fill_rgba: [50, 50, 50, 0.8]}),
                operator:  wktOperator,
                data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                    wktOperator
                ),
                prov$: this.mappingQueryService.getProvenanceStream(wktOperator),
            })
        );
    }

    addPolygonLayer() {
        const iucnPumaOperator = new Operator({
            operatorType: new GFBioSourceType({
                datasource: 'IUCN',
                query: `{'globalAttributes':{'speciesName':'Puma concolor'},'localAttributes':{}}`,
                }),
            resultType: ResultTypes.POLYGONS,
            projection: Projections.WGS_84,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });

        this.layerService.addLayer(
            new VectorLayer({
                name: 'IUCN Puma Concolor',
                symbology: new SimpleVectorSymbology({fill_rgba: [253, 216, 53, 0.8]}),
                operator: iucnPumaOperator,
                data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                    iucnPumaOperator
                ),
                prov$: this.mappingQueryService.getProvenanceStream(iucnPumaOperator),
            })
        );
    }

    addRasterLayer() {
        const srtmOperator = new Operator({
            operatorType: new RasterSourceType({
                channel: 0,
                sourcename: 'srtm',
                transform: true,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Int16),
            units: new Map<string, Unit>().set('value', new Unit({
                measurement: 'elevation',
                unit: 'm',
                interpolation: Interpolation.Continuous,
            })),
        });

        this.layerService.addLayer(
            new RasterLayer({
                name: 'SRTM',
                symbology: new MappingColorizerRasterSymbology({},
                     this.mappingQueryService.getColorizerStream(srtmOperator)
                ),
                operator: srtmOperator,
                prov$: this.mappingQueryService.getProvenanceStream(srtmOperator),
            })
        );
    }

    addAllLayers() {
        this.addRasterLayer();
        this.addPolygonLayer();
        this.addLineLayer();
        this.addPointLayer();
    }

    addHistogramPlot() {
        const srtmOperator = new Operator({
            operatorType: new RasterSourceType({
                channel: 0,
                sourcename: 'srtm',
                transform: true,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Int16),
            units: new Map<string, Unit>().set('value', new Unit({
                measurement: 'elevation',
                unit: 'm',
                interpolation: Interpolation.Continuous,
            })),
        });
        const srtmHistogram = new Operator({
            operatorType: new HistogramType({
                attribute: 'value',
                range: 'data',
            }),
            resultType: ResultTypes.PLOT,
            projection: srtmOperator.projection,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
            rasterSources: [srtmOperator],
        });
        this.plotService.addPlot(
            new Plot({
                name: 'SRTM Histogram',
                operator: srtmHistogram,
                data$: this.mappingQueryService.getPlotDataStream(srtmHistogram),
            })
        );
    }

    addRPlotPlot() {
        const rPlotOperator = new Operator({
            operatorType: new RScriptType({
                code: `plot(c(1,2,3,6,7,8));`,
                resultType: ResultTypes.PLOT,
            }),
            resultType: ResultTypes.PLOT,
            projection: Projections.WGS_84,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });
        this.plotService.addPlot(
            new Plot({
                name: 'R Plot',
                operator: rPlotOperator,
                data$: this.mappingQueryService.getPlotDataStream(rPlotOperator),
            })
        );
    }

    addRTextPlot() {
        const rPlotOperator = new Operator({
            operatorType: new RScriptType({
                code: `
                    print("Hello world");
                    a <- 1:5;
                    print(a);
                `,
                resultType: ResultTypes.TEXT,
            }),
            resultType: ResultTypes.TEXT,
            projection: Projections.WGS_84,
            attributes: [],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });
        this.plotService.addPlot(
            new Plot({
                name: 'R Text',
                operator: rPlotOperator,
                data$: this.mappingQueryService.getPlotDataStream(rPlotOperator),
            })
        );
    }

    addAllPlots() {
        this.addRTextPlot();
        this.addRPlotPlot();
        this.addHistogramPlot();
    }

}
