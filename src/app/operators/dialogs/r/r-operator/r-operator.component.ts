
import {first} from 'rxjs/operators';
import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild, Input} from '@angular/core';
import {ResultTypes, ResultType} from '../../../result-type.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {CodeEditorComponent} from '../../../../util/components/code-editor.component';
import {ProjectService} from '../../../../project/project.service';
import {DataType} from '../../../datatype.model';
import {Projections} from '../../../projection.model';
import {Operator} from '../../../operator.model';
import {RasterLayer, VectorLayer, Layer} from '../../../../layers/layer.model';
import {RScriptType} from '../../../types/r-script-type.model';
import {Unit} from '../../../unit.model';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {Plot} from '../../../../plots/plot.model';
import {
    RasterSymbology,
    AbstractVectorSymbology,
    AbstractSymbology,
    ComplexPointSymbology
} from '../../../../layers/symbology/symbology.model';
import {MatDialog} from '@angular/material';
import {RScriptSaveComponent, RScriptSaveComponentConfig} from '../r-script-save/r-script-save.component';
import {RScriptLoadComponent, RScriptLoadResult} from '../r-script-load/r-script-load.component';
import {Config} from '../../../../config.service';
import {WaveValidators} from '../../../../util/form.validators';

@Component({
    selector: 'wave-r-operator',
    templateUrl: './r-operator.component.html',
    styleUrls: ['./r-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ROperatorComponent implements OnInit, AfterViewInit {

    // make available
    ResultTypes = ResultTypes;
    //

    @ViewChild(CodeEditorComponent, { static: true }) codeEditor: CodeEditorComponent;

    form: FormGroup;

    @Input() editable: Layer<AbstractSymbology> | Plot = undefined;
    editableSourceLines: Array<Operator> = undefined;
    editableSourcePoints: Array<Operator> = undefined;
    editableSourcePolygons: Array<Operator> = undefined;
    editableSourceRasters: Array<Operator> = undefined;

    outputTypes: Array<ResultType>;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService,
                private randomColorService: RandomColorService,
                private dialog: MatDialog,
                private config: Config) {
    }

    ngOnInit() {
        if (this.config.DEBUG_MODE.WAVE) {
            this.outputTypes = [ResultTypes.POINTS, ResultTypes.PLOT, ResultTypes.RASTER, ResultTypes.TEXT];
        } else {
            this.outputTypes = [ResultTypes.PLOT, ResultTypes.TEXT];
        }

        this.form = this.formBuilder.group({
            lineLayers: [[]],
            polygonLayers: [[]],
            rasterLayers: [[]],
            pointLayers: [[]],
            code: [`print("Hello world");\na <- 1:5;\nprint(a);`, Validators.required],
            resultType: [ResultTypes.TEXT, Validators.required],
            name: ['R Output', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });

        if (this.editable) {
            // edit existing operator

            let name: string;
            let operatorType: RScriptType;
            let resultType: ResultType;
            let rasterOperators: Array<Operator>;
            let pointOperators: Array<Operator>;
            let lineOperators: Array<Operator>;
            let polygonOperators: Array<Operator>;

            if (this.editable instanceof VectorLayer) {
                const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.editable;
                name = vectorLayer.name;
                resultType = vectorLayer.operator.resultType;
                rasterOperators = vectorLayer.operator.getSources(ResultTypes.RASTER).toArray();
                pointOperators = vectorLayer.operator.getSources(ResultTypes.POINTS).toArray();
                lineOperators = vectorLayer.operator.getSources(ResultTypes.LINES).toArray();
                polygonOperators = vectorLayer.operator.getSources(ResultTypes.POLYGONS).toArray();
                operatorType = vectorLayer.operator.operatorType as RScriptType;
            } else if (this.editable instanceof RasterLayer) {
                const rasterLayer: RasterLayer<RasterSymbology> = this.editable as RasterLayer<RasterSymbology>;
                name = rasterLayer.name;
                resultType = rasterLayer.operator.resultType;
                rasterOperators = rasterLayer.operator.getSources(ResultTypes.RASTER).toArray();
                pointOperators = rasterLayer.operator.getSources(ResultTypes.POINTS).toArray();
                lineOperators = rasterLayer.operator.getSources(ResultTypes.LINES).toArray();
                polygonOperators = rasterLayer.operator.getSources(ResultTypes.POLYGONS).toArray();
                operatorType = rasterLayer.operator.operatorType as RScriptType;
            } else if (this.editable instanceof Plot) {
                const plot: Plot = this.editable;
                name = plot.name;
                resultType = plot.operator.resultType;
                rasterOperators = plot.operator.getSources(ResultTypes.RASTER).toArray();
                pointOperators = plot.operator.getSources(ResultTypes.POINTS).toArray();
                lineOperators = plot.operator.getSources(ResultTypes.LINES).toArray();
                polygonOperators = plot.operator.getSources(ResultTypes.POLYGONS).toArray();
                operatorType = plot.operator.operatorType as RScriptType;
            } else {
                throw Error('unknown type to edit');
            }

            this.form.controls['name'].setValue(name);
            this.form.controls['resultType'].setValue(resultType);
            this.form.controls['code'].setValue(operatorType.toDict().code);

            // this.form.controls['rasterLayers'].setValue(rasterLayers);
            // this.form.controls['pointLayers'].setValue(pointLayers);
            this.editableSourceRasters = rasterOperators;
            this.editableSourcePoints = pointOperators;
            this.editableSourceLines = lineOperators;
            this.editableSourcePolygons = polygonOperators;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.codeEditor.refresh();
        });
    }

    load() {
        this.dialog.open(RScriptLoadComponent)
            .afterClosed().pipe(
            first())
            .subscribe((result: RScriptLoadResult) => {
                if (result) {
                    this.form.controls['code'].setValue(result.script.code);
                    this.form.controls['resultType'].setValue(result.script.resultType);
                }
            });
    }

    save() {
        this.dialog.open(
            RScriptSaveComponent,
            {
                data: {
                    script: {
                        code: this.form.controls['code'].value,
                        resultType: this.form.controls['resultType'].value,
                    }
                }  as RScriptSaveComponentConfig
            }
        );
    }

    add(event: any) {
        const rasterLayers: Array<RasterLayer<RasterSymbology>> = this.form.controls['rasterLayers'].value;
        const pointLayers: Array<VectorLayer<AbstractVectorSymbology>> = this.form.controls['pointLayers'].value;
        const lineLayers: Array<VectorLayer<AbstractVectorSymbology>> = this.form.controls['lineLayers'].value;
        const polygonLayers: Array<VectorLayer<AbstractVectorSymbology>> = this.form.controls['polygonLayers'].value;

        const getAnySource = (index: number) => {
            const allSources = [...rasterLayers, ...pointLayers, ...lineLayers, ...polygonLayers];
            return allSources[index];
        };

        const outputName: string = this.form.controls['name'].value;
        const resultType: DataType = this.form.controls['resultType'].value;
        const code = this.form.controls['code'].value;

        // TODO: user input?
        const projection = getAnySource(0) === undefined ?
            Projections.WGS_84 : getAnySource(0).operator.projection;

        let rasterSources: Array<Operator>;
        let pointSources: Array<Operator>;
        let lineSources: Array<Operator>;
        let polygonSources: Array<Operator>;

        if (this.editable) {
            rasterSources = this.editableSourceRasters.map(o => o.getProjectedOperator(projection));
            pointSources = this.editableSourcePoints.map(o => o.getProjectedOperator(projection));
            lineSources = this.editableSourceLines.map(o => o.getProjectedOperator(projection));
            polygonSources = this.editableSourcePolygons.map(o => o.getProjectedOperator(projection));
        } else {
            rasterSources = rasterLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            );
            pointSources = pointLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            );
            lineSources = lineLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            );
            polygonSources = polygonLayers.map(
                layer => layer.operator.getProjectedOperator(projection)
            );
        }

        const operator = new Operator({
            operatorType: new RScriptType({
                code: code,
                resultType: resultType,
            }),
            resultType: resultType,
            projection: projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: rasterSources,
            pointSources: pointSources,
            lineSources: lineSources,
            polygonSources: polygonSources
        });

        if (ResultTypes.LAYER_TYPES.indexOf(resultType) >= 0) {

            // LAYER
            let layer: Layer<AbstractSymbology>;
            switch (resultType) {
                case ResultTypes.POINTS:
                    layer = new VectorLayer({
                        name: outputName,
                        operator: operator,
                        symbology: ComplexPointSymbology.createSimpleSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        }),
                        // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                        //     operator,
                        // }),
                        // provenance: provenance$,
                    });
                    break;
                case ResultTypes.RASTER:
                    layer = new RasterLayer({
                        name: outputName,
                        operator: operator,
                        // TODO: read out of operator if specified
                        symbology: new RasterSymbology({unit: Unit.defaultUnit}),
                        // provenance: provenance$,
                    });
                    break;
                default:
                    throw Error('Unknown AbstractSymbology Error');
            }

            if (this.editable) {
                // TODO: implement replace functionality
                this.projectService.addLayer(layer);
            } else {
                this.projectService.addLayer(layer);
            }

        } else {

            // PLOT
            const plot = new Plot({
                name: outputName,
                operator: operator,
            });

            if (this.editable) {
                this.projectService.replacePlot(this.editable as Plot, plot);
            } else {
                this.projectService.addPlot(plot);
            }

        }

    }

}
