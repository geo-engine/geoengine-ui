import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {LayerService} from '../layers/layer.service';
import {PlotService} from '../plots/plot.service';
import {ProjectService} from '../project/project.service';
import {MappingQueryService} from '../queries/mapping-query.service';

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
import {ExpressionType} from '../operators/types/expression-type.model';
import {ClassificationType} from '../operators/types/classification-type.model';
import {ProjectionType} from '../operators/types/projection-type.model';

import {
    MsgRadianceType,
    MsgReflectanceType, MsgReflectanceTypeDict,
    MsgSolarangleType, MsgSolarangleTypeDict,
    MsgTemperatureType,
    MsgPansharpenType, MsgPansharpenTypeDict,
    MsgCo2CorrectionType,
    MsgSofosGccThermalThresholdType,
} from '../operators/types/msg-types.model';


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
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary"
                            (click)="addCloudLayer()">
                        <i md-icon>cloud</i>
                        Clouds
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
                dataSource: 'GBIF',
                scientificName: 'Puma concolor',
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
                symbology: new SimplePointSymbology({fillRGBA: [244, 67, 54, 0.8]}),
                operator: gbifPumaOperator,
                data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    operator: gbifPumaOperator,
                }),
                provenance: this.mappingQueryService.getProvenanceStream(gbifPumaOperator),
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
                symbology: new SimpleVectorSymbology({fillRGBA: [50, 50, 50, 0.8]}),
                operator:  wktOperator,
                data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    operator: wktOperator,
                }),
                provenance: this.mappingQueryService.getProvenanceStream(wktOperator),
            })
        );
    }

    addPolygonLayer() {
        const iucnPumaOperator = new Operator({
            operatorType: new GFBioSourceType({
                dataSource: 'IUCN',
                scientificName: 'Puma concolor',
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
                symbology: new SimpleVectorSymbology({fillRGBA: [253, 216, 53, 0.8]}),
                operator: iucnPumaOperator,
                data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    operator: iucnPumaOperator,
                }),
                provenance: this.mappingQueryService.getProvenanceStream(iucnPumaOperator),
            })
        );
    }

    addRasterLayer() {
        const unit = new Unit({
            measurement: 'elevation',
            unit: 'm',
            interpolation: Interpolation.Continuous,
        });

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
            units: new Map<string, Unit>().set('value', unit),
        });

        this.layerService.addLayer(
            new RasterLayer({
                name: 'SRTM',
                symbology: new MappingColorizerRasterSymbology(
                    { unit: unit },
                    this.mappingQueryService.getColorizerStream(srtmOperator)
                ),
                operator: srtmOperator,
                provenance: this.mappingQueryService.getProvenanceStream(srtmOperator),
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
                data: this.mappingQueryService.getPlotDataStream(srtmHistogram),
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
                data: this.mappingQueryService.getPlotDataStream(rPlotOperator),
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
                data: this.mappingQueryService.getPlotDataStream(rPlotOperator),
            })
        );
    }

    addAllPlots() {
        this.addRTextPlot();
        this.addRPlotPlot();
        this.addHistogramPlot();
    }

    addCloudLayer() {
        const msg_temp_unit = new Unit({
            measurement: 'temperature',
            unit: 'C',
            interpolation: Interpolation.Continuous,
        });

        const bin_unit = new Unit({
            measurement: 'raw',
            unit: 'unknown',
            interpolation: Interpolation.Discrete,
            max: 1,
            min: 0,
        });

        const dnt_unit = new Unit({
            measurement: 'raw',
            unit: 'unknown',
            interpolation: Interpolation.Discrete,
            max: 3,
            min: 1,
        });

        const diff_unit = new Unit({
            measurement: 'raw',
            unit: 'unknown',
            interpolation: Interpolation.Continuous,
            max: 50,
            min: -50,
        });

        // raw channels
        const msg_raw_3 = DebugTabComponent.createMsgRawOp(3, false);
        const msg_raw_4 = DebugTabComponent.createMsgRawOp(4, false);
        const msg_raw_5 = DebugTabComponent.createMsgRawOp(5, false);
        const msg_raw_6 = DebugTabComponent.createMsgRawOp(6, false);
        const msg_raw_7 = DebugTabComponent.createMsgRawOp(7, false);
        const msg_raw_8 = DebugTabComponent.createMsgRawOp(8, false);
        const msg_raw_9 = DebugTabComponent.createMsgRawOp(9, false);
        const msg_raw_10 = DebugTabComponent.createMsgRawOp(10, false);

        // temp channels
        const msg_temp_3 = DebugTabComponent.createMsgTemperatureOp(msg_raw_3);
        const msg_temp_4 = DebugTabComponent.createMsgTemperatureOp(msg_raw_4);
        const msg_temp_5 = DebugTabComponent.createMsgTemperatureOp(msg_raw_5);
        const msg_temp_6 = DebugTabComponent.createMsgTemperatureOp(msg_raw_6);
        const msg_temp_7 = DebugTabComponent.createMsgTemperatureOp(msg_raw_7);
        const msg_temp_8 = DebugTabComponent.createMsgTemperatureOp(msg_raw_8);
        const msg_temp_9 = DebugTabComponent.createMsgTemperatureOp(msg_raw_9);
        const msg_temp_10 = DebugTabComponent.createMsgTemperatureOp(msg_raw_10);

        // vis channels
        const msg_vis_0 = DebugTabComponent.createMsgRawOp(0, true);
        const msg_vis_1 = DebugTabComponent.createMsgRawOp(1, true);
        const msg_vis_2 = DebugTabComponent.createMsgRawOp(2, true);

        // refl channels
        const msg_refl_0 = DebugTabComponent.createMsgReflectanceOp(msg_vis_0);
        const msg_refl_1 = DebugTabComponent.createMsgReflectanceOp(msg_vis_1);
        const msg_refl_2 = DebugTabComponent.createMsgReflectanceOp(msg_vis_2);

        const srtm = new Operator({
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

        const landSea = new Operator({
            operatorType: new ClassificationType({
                remapRangeValues: [-1000, 0, 1],
                remapRangeClasses: [0, 10000, 2],
                noDataClass: 1,
                reclassNoData: true,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', diff_unit),
            rasterSources: [srtm],
        });

        const landSeaGeos = new Operator({
            operatorType: new ProjectionType({
                srcProjection: Projections.fromCode('EPSG:4326'),
                destProjection: Projections.fromCode('EPSG:40453'),
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', diff_unit),
            rasterSources: [landSea],
        });

        const diff_expr = new Operator({
            operatorType: new ExpressionType({
                expression: 'A-B',
                datatype: DataTypes.Float32,
                unit: diff_unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', diff_unit),
            rasterSources: [msg_temp_8, msg_temp_3],
        });

        const msg_solar_zenith = new Operator({
            operatorType: new MsgSolarangleType({
                solarangle: 'zenith',
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', Unit.defaultUnit),
            rasterSources: [msg_raw_8],
        });

        const msg_sofos_th = new Operator({
            operatorType: new MsgSofosGccThermalThresholdType({}),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', Unit.defaultUnit),
            rasterSources: [msg_solar_zenith, diff_expr],
        });

        const dnt = new Operator({
            operatorType: new ExpressionType({
                expression: '(A<93)?1:((A<100)?2:3)',
                datatype: DataTypes.Byte,
                unit: dnt_unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Byte),
            units: new Map<string, Unit>().set('value', dnt_unit),
            rasterSources: [msg_solar_zenith],
        });

        const lastStep = new Operator({
            operatorType: new ExpressionType({
                expression: '((K-F<=J)|((A==2)&(((B==2)&(K-M<=15))|((B==1)&(K-M<=18))|(K-I>=2)))|((A==3)&(F-L>1))|((A==3)&(((B==1)&(I-F>7))))|((K<253))|((G<220)|(H<240)|((H-G)<=13))|(((A==1)&(K<261))|(I-K>0)))&(!((A==1)&(E/C>1.5)))&(!((A==1)&(B==2)&((C-E)/(C+E)>=0.4)&(K>=265)))',
                datatype: DataTypes.Byte,
                unit: bin_unit,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Byte),
            units: new Map<string, Unit>().set('value', bin_unit),
            rasterSources: [dnt, landSeaGeos, msg_refl_0, msg_refl_1, msg_refl_2, msg_temp_3, msg_temp_4, msg_temp_5, msg_temp_6, msg_sofos_th, msg_temp_8, msg_temp_9, msg_temp_10],
        });

        let cloud_unit = diff_unit;
        const op_graph = lastStep;

        this.layerService.addLayer(
            new RasterLayer({
                name: 'SOFOS clouds',
                symbology: new MappingColorizerRasterSymbology(
                    { unit: cloud_unit },
                    this.mappingQueryService.getColorizerStream(op_graph)
                ),
                operator: op_graph,
                provenance: this.mappingQueryService.getProvenanceStream(op_graph),
            })
        );
    }

    static createMsgRawOp(channel: number, transform: boolean): Operator {
        const msgRawOp = new Operator({
            operatorType: new RasterSourceType({
                channel: channel,
                sourcename: 'msg9_geos',
                transform: transform,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Int16),
            units: new Map<string, Unit>().set('value', Unit.defaultUnit),
        });
        return msgRawOp;
    }

    static createMsgTemperatureOp(rawOp: Operator): Operator {
        const msgTempOp = new Operator({
            operatorType: new MsgTemperatureType({}),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', Unit.defaultUnit),
            rasterSources: [rawOp],
        });

        return msgTempOp;
    }

    static createMsgReflectanceOp(radiance: Operator): Operator {
        const msgReflOp = new Operator({
            operatorType: new MsgReflectanceType({
                isHrv: false,
                solarCorrection: true,
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.Float32),
            units: new Map<string, Unit>().set('value', Unit.defaultUnit),
            rasterSources: [radiance],
        });

        return msgReflOp;
    }

}
