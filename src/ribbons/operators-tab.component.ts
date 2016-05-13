import {
    Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef,
} from 'angular2/core';

import {MATERIAL_DIRECTIVES, MdDialog} from 'ng2-material/all';

import {LayerService} from '../services/layer.service';
import {PlotService} from '../plots/plot.service';
import {ProjectService} from '../services/project.service';
import {MappingQueryService} from '../services/mapping-query.service';
import {MappingColorizerService} from '../services/mapping-colorizer.service';
import {RandomColorService} from '../services/random-color.service';

import {OperatorBase, OperatorDialogConfig} from '../components/operators/operator.component';
import {ExpressionOperatorComponent} from '../components/operators/expression-operator.component';
import {RasterValueExtractionOperatorComponent}
  from '../components/operators/raster-value-extraction.component';
import {NumericAttributeFilterOperatorComponent}
  from '../components/operators/numeric-attribute-filter.component';
import {PointInPolygonFilterOperatorComponent}
  from '../components/operators/point-in-polygon-filter.component';
import {HistogramOperatorComponent} from '../components/operators/histogram.component';
import {ROperatorComponent} from '../components/operators/r-operator.component';
import {
    MsgRadianceOperatorComponent, MsgReflectanceOperatorComponent,
    MsgSolarangleOperatorComponent, MsgTemperatureOperatorComponent,
    MsgPansharpenOperatorComponent, MsgCo2CorrectionOperatorComponent,
} from '../components/operators/msg-operators.component';

/**
 * The operator tab of the ribbons component.
 */
@Component({
    selector: 'wave-operators-tab',
    template: `
    <md-content layout="row">
        <fieldset>
            <legend>Vector</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addRasterValueExtractionOperator()">
                        <i md-icon>settings</i>
                        <div>Raster Value Extraction</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addNumericAttributesFilterOperator()">
                        <i md-icon>settings</i>
                        <div>Numeric Attributes Filter</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addPointInPolygonFilterOperator()">
                        <i md-icon>settings</i>
                        <div>Point in Polygon Filter</div>
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>Raster</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addExpressionOperator()">
                        <i md-icon>settings</i>
                        <div>Expression</div>
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>Plots</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addHistogramOperator()">
                        <i md-icon>settings</i>
                        <div>Histogram</div>
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>Other</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addROperator()">
                        <i md-icon>settings</i>
                        <div>R Scripts</div>
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>MSG</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgRadianceOperator()">
                        <i md-icon>satellite</i>
                        <div>Radiance</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgReflectanceOperator()">
                        <i md-icon>satellite</i>
                        <div>Reflectance</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgSolarangleOperator()">
                        <i md-icon>satellite</i>
                        <div>Solarangle</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgTemperatureOperator()">
                        <i md-icon>satellite</i>
                        <div>Temperature</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgPansharpenOperator()">
                        <i md-icon>satellite</i>
                        <div>Pansharpen</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addMsgCo2CorrectionOperator()">
                        <i md-icon>satellite</i>
                        <div>CO2 correction</div>
                    </button>
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
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorsTabComponent {
    @Input() maxWidth: number;

    @Output() showOperator = new EventEmitter<OperatorBase>();

    constructor(
        private elementRef: ElementRef,
        private mdDialog: MdDialog,
        private layerService: LayerService,
        private plotService: PlotService,
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService,
        private mappingColorizerService: MappingColorizerService,
        private randomColorService: RandomColorService
    ) {}

    addExpressionOperator() {
        this.showOperatorDialog(ExpressionOperatorComponent);
    }

    addRasterValueExtractionOperator() {
        this.showOperatorDialog(RasterValueExtractionOperatorComponent);
    }

    addNumericAttributesFilterOperator() {
        this.showOperatorDialog(NumericAttributeFilterOperatorComponent);
    }

    addROperator() {
        this.showOperatorDialog(ROperatorComponent);
    }

    addHistogramOperator() {
        this.showOperatorDialog(HistogramOperatorComponent);
    }

    addPointInPolygonFilterOperator() {
        this.showOperatorDialog(PointInPolygonFilterOperatorComponent);
    }

    addMsgRadianceOperator() {
        this.showOperatorDialog(MsgRadianceOperatorComponent);
    }

    addMsgReflectanceOperator() {
        this.showOperatorDialog(MsgReflectanceOperatorComponent);
    }

    addMsgSolarangleOperator() {
        this.showOperatorDialog(MsgSolarangleOperatorComponent);
    }

    addMsgTemperatureOperator() {
        this.showOperatorDialog(MsgTemperatureOperatorComponent);
    }

    addMsgPansharpenOperator() {
        this.showOperatorDialog(MsgPansharpenOperatorComponent);
    }

    addMsgCo2CorrectionOperator() {
        this.showOperatorDialog(MsgCo2CorrectionOperatorComponent);
    }

    private showOperatorDialog(
        OperatorComponent: OperatorBase // tslint:disable-line: variable-name
    ) {
        const config = new OperatorDialogConfig()
            .layerService(this.layerService)
            .plotService(this.plotService)
            .projectService(this.projectService)
            .mappingQueryService(this.mappingQueryService)
            .mappingColorizerService(this.mappingColorizerService)
            .randomColorService(this.randomColorService)
            .clickOutsideToClose(true);

        this.mdDialog.open(OperatorComponent as Function, this.elementRef, config);
    }
}
