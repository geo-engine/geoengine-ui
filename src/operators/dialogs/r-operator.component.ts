import {
    Component, ChangeDetectionStrategy, OnInit, ViewChild, AfterViewInit, OnDestroy,
} from '@angular/core';
import {
    COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control,
} from '@angular/common';

import {BehaviorSubject, Subject, Subscription} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {
    LayerMultiSelectComponent, OperatorBaseComponent, OperatorOutputNameComponent,
} from './operator.component';
import {CodeEditorComponent} from '../../components/code-editor.component';

import {LayerService} from '../../layers/layer.service';
import {PlotService} from '../../plots/plot.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {ProjectService} from '../../project/project.service';

import {Layer, VectorLayer, RasterLayer} from '../../layers/layer.model';
import {Plot} from '../../plots/plot.model';
import {
    Symbology, SimplePointSymbology, RasterSymbology, AbstractVectorSymbology,
} from '../../symbology/symbology.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {DataType} from '../datatype.model';
import {Unit} from '../unit.model';
import {Projections} from '../projection.model';
import {RScriptType} from '../types/r-script-type.model';

import {DialogLoaderComponent} from '../../dialogs/dialog-loader.component';
import {RScriptLoadDialogComponent} from './r/r-script-load-dialog.component';
import {RScriptSaveDialogComponent} from './r/r-script-save-dialog.component';
import {RScript} from '../../storage/storage-provider.model';

/**
 * This component allows creating the R operator.
 */
@Component({
    selector: 'wave-r-operator',
    template: `
    <form [ngFormModel]="form">
        <wave-multi-layer-selection [layers]="layers" [min]="0" [max]="5" initialAmount="0"
                                    [types]="[ResultTypes.RASTER]"
                                    (selectedLayers)="rasterSources = $event">
        </wave-multi-layer-selection>
        <wave-multi-layer-selection [layers]="layers" [min]="0" [max]="5" initialAmount="0"
                                    [types]="[ResultTypes.POINTS]"
                                    (selectedLayers)="pointSources = $event">
        </wave-multi-layer-selection>
        <md-card>
            <md-card-header>
                <md-card-header-text>
                    <span class="md-title">Configuration</span>
                    <span class="md-subheader">Specify the operator</span>
                </md-card-header-text>
            </md-card-header>
            <md-card-content>
                <p>Help?</p>
                <wave-code-editor language="r" ngControl="code"></wave-code-editor>
                <div layout="row">
                    <div>
                        <label for="dataType">Result Type</label>
                        <select ngControl="resultType">
                            <option
                                *ngFor="let resultType of [ResultTypes.RASTER, ResultTypes.POINTS,
                                                           ResultTypes.PLOT, ResultTypes.TEXT]"
                                [ngValue]="resultType"
                            >{{resultType}}</option>
                        </select>
                    </div>
                    <span flex></span>
                    <button md-button class='md-button'
                            aria-label='Save'
                            (click)='scriptSaveDialog.show({
                                initialName: currentScriptName$.value,
                                newName$: currentScriptName$,
                                script: {
                                    code: form.controls.code.value,
                                    resultType: form.controls.resultType.value
                                }
                            })'>
                        <i md-icon>archive</i>
                        Save
                    </button>
                    <button md-button class='md-button'
                            style='margin-left: -16px;'
                            (click)='scriptLoadDialog.show({
                                script$: scriptLoaded$,
                                currentName: currentScriptName$.value,
                                newCurrentName$: currentScriptName$
                            })'>
                        <i md-icon>unarchive</i>
                        Load
                    </button>
                </div>
            </md-card-content>
        </md-card>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    <wave-dialog-loader #scriptSaveDialog
        [type]="RScriptSaveDialogComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #scriptLoadDialog
        [type]="RScriptLoadDialogComponent"
    ></wave-dialog-loader>
    `,
    styles: [`
    label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
    }
    wave-code-editor {
        min-width: 400px;
        margin-right: 4px;
    }
    button i {
        vertical-align: middle;
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        OperatorOutputNameComponent, LayerMultiSelectComponent, CodeEditorComponent,
        DialogLoaderComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ROperatorComponent extends OperatorBaseComponent
                                implements OnInit, AfterViewInit, OnDestroy {
    // make this available in the template
    // tslint:disable:variable-name
    RScriptSaveDialogComponent = RScriptSaveDialogComponent;
    RScriptLoadDialogComponent = RScriptLoadDialogComponent;
    // tslint:enable

    @ViewChild(CodeEditorComponent) codeEditor: CodeEditorComponent;

    form: ControlGroup;
    rasterSources: Array<RasterLayer<RasterSymbology>> = [];
    pointSources: Array<VectorLayer<AbstractVectorSymbology>> = [];

    currentScriptName$ = new BehaviorSubject<string>('');
    scriptLoaded$ = new Subject<RScript>();

    private subscriptions: Array<Subscription> = [];

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private plotService: PlotService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        this.form = formBuilder.group({
            code: [`print("Hello world");\na <- 1:5;\nprint(a);`, Validators.required],
            resultType: [ResultTypes.TEXT, Validators.required],
            name: ['R Output', Validators.required],
        });

        this.subscriptions.push(
            this.scriptLoaded$.subscribe(script => {
                (this.form.controls['resultType'] as Control).updateValue(script.resultType);
                (this.form.controls['code'] as Control).updateValue(script.code);
            })
        );
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Execute R Script (experimental)');
    }

    ngAfterViewInit() {
        this.codeEditor.refresh();
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    add() {
        const getAnySource = (index: number) => {
            const allSources = [...this.rasterSources, ...this.pointSources];
            return allSources[index];
        };

        const outputName: string = this.form.controls['name'].value;
        const resultType: DataType = this.form.controls['resultType'].value;
        const code = this.form.controls['code'].value;

        // TODO: user input?
        const projection = getAnySource(0) === undefined ?
            Projections.WGS_84 : getAnySource(0).operator.projection;

        const rasterSources: Array<Operator> = this.rasterSources.map(
            layer => layer.operator.getProjectedOperator(projection)
        );
        const pointSources: Array<Operator> = this.pointSources.map(
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
                    throw 'Unknown Symbology Error';
            }
            this.layerService.addLayer(layer);
        } else {
            // PLOT
            const plot = new Plot({
                name: outputName,
                operator: operator,
                data: this.mappingQueryService.getPlotDataStream(operator),
            });
            this.plotService.addPlot(plot);
        }

        this.dialog.close();
    }

}
