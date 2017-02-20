import {
    Component, Input, ChangeDetectionStrategy, ElementRef, ViewChildren,
    QueryList, AfterViewInit, ChangeDetectorRef, ViewChild,
} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {OperatorSelectionGroupComponent} from './operator-selection-group.component';

import Config from '../app/config.model';

import {LayerService} from '../layers/layer.service';
import {PlotService} from '../plots/plot.service';
import {ProjectService} from '../project/project.service';
import {MappingQueryService} from '../queries/mapping-query.service';
import {RandomColorService} from '../services/random-color.service';

import {RasterValueExtractionType} from '../app/operators/types/raster-value-extraction-type.model';
import {NumericAttributeFilterType} from '../app/operators/types/numeric-attribute-filter-type.model';
import {PointInPolygonFilterType} from '../app/operators/types/point-in-polygon-filter-type.model';
import {ExpressionType} from '../app/operators/types/expression-type.model';
import {HistogramType} from '../app/operators/types/histogram-type.model';
import {RScriptType} from '../app/operators/types/r-script-type.model';
import {
    MsgRadianceType, MsgReflectanceType,
    MsgSolarangleType, MsgTemperatureType,
    MsgPansharpenType, MsgCo2CorrectionType,
} from '../app/operators/types/msg-types.model';

import {RasterValueExtractionOperatorComponent}
  from '../app/operators/dialogs/raster-value-extraction/raster-value-extraction.component';
import {NumericAttributeFilterOperatorComponent}
  from '../app/operators/dialogs/numeric-attribute-filter/numeric-attribute-filter.component';
import {PointInPolygonFilterOperatorComponent}
  from '../app/operators/dialogs/point-in-polygon-filter/point-in-polygon-filter.component';
import {ExpressionOperatorComponent} from '../app/operators/dialogs/expression-operator/expression-operator.component';
// FIXME: import {HistogramOperatorComponent} from '../operators/dialogs/histogram.component';
import {ROperatorComponent} from '../app/operators/dialogs/r-operator.component';
import {
     MsgRadianceOperatorComponent, MsgReflectanceOperatorComponent,
     MsgSolarangleOperatorComponent, MsgTemperatureOperatorComponent,
     MsgPansharpenOperatorComponent, MsgCo2CorrectionOperatorComponent,
} from '../app/operators/dialogs/msg-operators.component';
import {MdDialog} from "@angular/material";

/**
 * The operator tab of the ribbons component.
 */
@Component({
    selector: 'wave-operators-tab',
    template: `
    <div class="ribbons" #container layout="row">
        <wave-operator-selection-group groupName="Vector" [smallButtons]="smallButtons">
            <wave-operator-button [small]="smallButtons"
                [text]="RasterValueExtractionType.NAME"
                [iconUrl]="RasterValueExtractionType.ICON_URL"
                (click)="dialog.open(RasterValueExtractionOperatorComponent)">
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="NumericAttributeFilterType.NAME"
                [iconUrl]="NumericAttributeFilterType.ICON_URL"
                (click)="dialog.open(NumericAttributeFilterOperatorComponent)">
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="PointInPolygonFilterType.NAME"
                [iconUrl]="PointInPolygonFilterType.ICON_URL"
                (click)="dialog.open(PointInPolygonFilterOperatorComponent)">
            </wave-operator-button>
            <wave-operator-button
                 [small]="smallButtons"
                text="FAKE"
                [iconUrl]="PointInPolygonFilterType.ICON_URL"
            ></wave-operator-button>
        </wave-operator-selection-group>
        <wave-operator-selection-group groupName="Raster" [smallButtons]="smallButtons">
            <wave-operator-button [small]="smallButtons"
                [text]="ExpressionType.NAME"
                [iconUrl]="ExpressionType.ICON_URL"
                (click)="dialog.open(ExpressionOperatorComponent)">
            </wave-operator-button>
        </wave-operator-selection-group>
        <wave-operator-selection-group groupName="Plots" [smallButtons]="smallButtons">
            <wave-operator-button [small]="smallButtons"
                [text]="HistogramType.NAME"
                [iconUrl]="HistogramType.ICON_URL">
                <!--(click)="histogramOperatorDialog.show()">-->
            </wave-operator-button>
        </wave-operator-selection-group>
        <wave-operator-selection-group groupName="Misc" [smallButtons]="smallButtons" *ngIf="Config.DEVELOPER_MODE">
            <wave-operator-button [small]="smallButtons"
                [text]="RScriptType.NAME"
                [iconUrl]="RScriptType.ICON_URL">
                <!--(click)="rOperatorComponentDialog.show()">-->
            </wave-operator-button>
        </wave-operator-selection-group>
        <wave-operator-selection-group groupName="MSG" [smallButtons]="smallButtons">
            <wave-operator-button [small]="smallButtons"
                [text]="MsgRadianceType.NAME"
                [iconUrl]="MsgRadianceType.ICON_URL">
                <!--(click)="msgRadianceOperatorComponentDialog.show()">-->
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="MsgReflectanceType.NAME"
                [iconUrl]="MsgReflectanceType.ICON_URL">
                <!--(click)="msgReflectanceOperatorComponentDialog.show()">-->
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="MsgSolarangleType.NAME"
                [iconUrl]="MsgSolarangleType.ICON_URL">
                <!--(click)="msgSolarangleOperatorComponentDialog.show()">-->
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="MsgTemperatureType.NAME"
                [iconUrl]="MsgTemperatureType.ICON_URL">
                <!--(click)="msgTemperatureOperatorComponentDialog.show()">-->
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="MsgPansharpenType.NAME"
                [iconUrl]="MsgPansharpenType.ICON_URL">
                <!--(click)="msgPansharpenOperatorComponentDialog.show()">-->
            </wave-operator-button>
            <wave-operator-button [small]="smallButtons"
                [text]="MsgCo2CorrectionType.NAME"
                [iconUrl]="MsgCo2CorrectionType.ICON_URL">
                <!--(click)="msgCo2CorrectionOperatorComponentDialog.show()">-->
            </wave-operator-button>
        </wave-operator-selection-group>
    </div>
    <!--
    <wave-dialog-loader #rasterValueExtractionOperatorDialog
        [type]="RasterValueExtractionOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #numericAttributeFilterOperatorDialog
        [type]="NumericAttributeFilterOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #pointInPolygonFilterOperatorDialog
        [type]="PointInPolygonFilterOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #expressionOperatorDialog
        [type]="ExpressionOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #histogramOperatorDialog
        [type]="HistogramOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #rOperatorComponentDialog
        [type]="ROperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgRadianceOperatorComponentDialog
        [type]="MsgRadianceOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgReflectanceOperatorComponentDialog
        [type]="MsgReflectanceOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgSolarangleOperatorComponentDialog
        [type]="MsgSolarangleOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgTemperatureOperatorComponentDialog
        [type]="MsgTemperatureOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgPansharpenOperatorComponentDialog
        [type]="MsgPansharpenOperatorComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #msgCo2CorrectionOperatorComponentDialog
        [type]="MsgPansharpenOperatorComponent"
    ></wave-dialog-loader>
    -->
    `,
    styles: [`
    .ribbons {
      display: flex;
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorsTabComponent implements AfterViewInit {
    @ViewChildren(OperatorSelectionGroupComponent)
    groups: QueryList<OperatorSelectionGroupComponent>;

    @ViewChild('container') container: ElementRef;

    @Input() maxWidth: number;

    smallButtons = false;

    // make config available in the view
    Config = Config; // tslint:disable-line:variable-name

    // make these types accessible in the view
    // tslint:disable:variable-name
    RasterValueExtractionType = RasterValueExtractionType;
    NumericAttributeFilterType = NumericAttributeFilterType;
    PointInPolygonFilterType = PointInPolygonFilterType;
    ExpressionType = ExpressionType;
    HistogramType = HistogramType;
    RScriptType = RScriptType;
    MsgRadianceType = MsgRadianceType;
    MsgReflectanceType = MsgReflectanceType;
    MsgSolarangleType = MsgSolarangleType;
    MsgTemperatureType = MsgTemperatureType;
    MsgPansharpenType = MsgPansharpenType;
    MsgCo2CorrectionType = MsgCo2CorrectionType;
    // tslint:enable

    // make these dialogs accessible in the view
    // tslint:disable:variable-name
    RasterValueExtractionOperatorComponent = RasterValueExtractionOperatorComponent;
    NumericAttributeFilterOperatorComponent = NumericAttributeFilterOperatorComponent;
    PointInPolygonFilterOperatorComponent = PointInPolygonFilterOperatorComponent;
    ExpressionOperatorComponent = ExpressionOperatorComponent;
    // FIXME: HistogramOperatorComponent = HistogramOperatorComponent;
    ROperatorComponent = ROperatorComponent;
    MsgRadianceOperatorComponent = MsgRadianceOperatorComponent;
    MsgReflectanceOperatorComponent = MsgReflectanceOperatorComponent;
    MsgSolarangleOperatorComponent = MsgSolarangleOperatorComponent;
    MsgTemperatureOperatorComponent = MsgTemperatureOperatorComponent;
    MsgPansharpenOperatorComponent = MsgPansharpenOperatorComponent;
    MsgCo2CorrectionOperatorComponent = MsgCo2CorrectionOperatorComponent;
    // tslint:enable

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MdDialog,
        private layerService: LayerService,
        private plotService: PlotService,
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService,
        private randomColorService: RandomColorService
    ) {}

    ngAfterViewInit() {
        // recalculate the button group sizing on window resize
        Observable.fromEvent(
            window, 'resize'
        ).map(_ => {
            // TODO: remove this hack
            this.groups.forEach(group => group.setVisibility(false));
            const width = this.container.nativeElement.clientWidth;
            this.groups.forEach(group => group.setVisibility(true));
            return width;
        }).subscribe(
            availabeWidth => this.setGroupSizeBasedOnMaxWidth(availabeWidth)
        );

        // initially calculate the button group sizing
        setTimeout(() => this.setGroupSizeBasedOnMaxWidth(
            this.container.nativeElement.clientWidth
        ), 500); // TODO: fix this delay
    }

    /**
     * This functions tries to find the maximum number of buttons to show incrementally.
     * It uses small buttons if a minimum value of visible buttons per group is reached.
     */
    private setGroupSizeBasedOnMaxWidth(availableWidth: number) {
        const minItemsPerGroup = 2;
        const maxItemsPerGroup = this.groups.reduce(
            (acc, group) => Math.max(acc, group.buttons.length),
            0
        );

        // try using large buttons
        this.groups.forEach(group => group.smallButtons = false);
        this.smallButtons = false;

        let itemsPerGroup = maxItemsPerGroup;
        let totalWidth: number;
        do {
            totalWidth = this.groups.reduce(
                (acc, group) => acc + group.getGroupWidth(itemsPerGroup),
                0
            );
            itemsPerGroup--;
        } while (
            totalWidth > availableWidth && itemsPerGroup >= minItemsPerGroup
        );

        if (totalWidth > availableWidth) {
            // use small buttons now
            this.groups.forEach(group => group.smallButtons = true);
            this.smallButtons = true;

            itemsPerGroup = maxItemsPerGroup; // reset to max
            do {
                totalWidth = this.groups.reduce(
                    (acc, group) => acc + group.getGroupWidth(itemsPerGroup),
                    0
                );
                itemsPerGroup--;
            } while (
                totalWidth > availableWidth && itemsPerGroup >= minItemsPerGroup
            );
        }

        // set the buttons for each group. +1 because of decrease in loop.
        this.groups.forEach(group => group.buttonsVisible = itemsPerGroup + 1);

        this.changeDetectorRef.markForCheck();
    }
}
