import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild} from '@angular/core';
import {ResultTypes} from '../../../result-type.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {CodeEditorComponent} from '../../../../../components/code-editor.component';
import {ProjectService} from '../../../../project/project.service';
import {LayerService} from '../../../../layers/layer.service';
import {DataType} from '../../../datatype.model';
import {Projections} from '../../../projection.model';
import {Operator} from '../../../operator.model';
import {RasterLayer, VectorLayer, Layer} from '../../../../layers/layer.model';
import {
    RasterSymbology, AbstractVectorSymbology,
    Symbology, SimplePointSymbology
} from '../../../../../symbology/symbology.model';
import {RScriptType} from '../../../types/r-script-type.model';
import {Unit} from '../../../unit.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {Plot} from '../../../../plots/plot.model';

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

    @ViewChild(CodeEditorComponent) codeEditor: CodeEditorComponent;

    form: FormGroup;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService,
                private layerService: LayerService,
                private mappingQueryService: MappingQueryService,
                private randomColorService: RandomColorService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            rasterLayers: [[]],
            pointLayers: [[]],
            code: [`print("Hello world");\na <- 1:5;\nprint(a);`, Validators.required],
            resultType: [ResultTypes.TEXT, Validators.required],
            name: ['R Output', Validators.required],
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.form.updateValueAndValidity();
            this.codeEditor.refresh();
        });
    }

    add() {
        const rasterLayers: Array<RasterLayer<RasterSymbology>> = this.form.controls['rasterLayers'].value;
        const pointLayers: Array<VectorLayer<AbstractVectorSymbology>> = this.form.controls['pointLayers'].value;

        const getAnySource = (index: number) => {
            const allSources = [...rasterLayers, ...pointLayers];
            return allSources[index];
        };

        const outputName: string = this.form.controls['name'].value;
        const resultType: DataType = this.form.controls['resultType'].value;
        const code = this.form.controls['code'].value;

        // TODO: user input?
        const projection = getAnySource(0) === undefined ?
            Projections.WGS_84 : getAnySource(0).operator.projection;

        const rasterSources: Array<Operator> = rasterLayers.map(
            layer => layer.operator.getProjectedOperator(projection)
        );
        const pointSources: Array<Operator> = pointLayers.map(
            layer => layer.operator.getProjectedOperator(projection)
        );

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
        });

        const provenance$ = this.mappingQueryService.getProvenanceStream(operator);

        if (ResultTypes.LAYER_TYPES.indexOf(resultType) >= 0) {

            // LAYER
            let layer: Layer<Symbology>;
            switch (resultType) {
                case ResultTypes.POINTS:
                    layer = new VectorLayer({
                        name: outputName,
                        operator: operator,
                        symbology: new SimplePointSymbology({
                            fillRGBA: this.randomColorService.getRandomColor(),
                        }),
                        data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                            operator,
                        }),
                        provenance: provenance$,
                    });
                    break;
                case ResultTypes.RASTER:
                    layer = new RasterLayer({
                        name: outputName,
                        operator: operator,
                        // TODO: read out of operator if specified
                        symbology: new RasterSymbology({unit: Unit.defaultUnit}),
                        provenance: provenance$,
                    });
                    break;
                default:
                    throw Error('Unknown Symbology Error');
            }
            this.layerService.addLayer(layer);

        } else {

            // PLOT
            const plot = new Plot({
                name: outputName,
                operator: operator,
            });
            this.projectService.addPlot(plot);

        }

    }

}
