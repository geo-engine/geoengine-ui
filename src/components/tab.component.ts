import {Component, Input, AfterViewInit, NgZone, Output, EventEmitter, ChangeDetectionStrategy,
        ChangeDetectorRef, AfterViewChecked, ViewChild} from "angular2/core";

import {BehaviorSubject, Subject} from "rxjs/Rx";

import {StorageService} from "../services/storage.service";

import {OperatorBaseComponent, OperatorBase} from "./operators/operator.component";
import {ExpressionOperatorComponent} from "./operators/expression-operator.component";
import {RasterValueExtractionOperatorComponent}
    from "./operators/raster-value-extraction.component";
import {NumericAttributeFilterOperatorComponent}
    from "./operators/numeric-attribute-filter.component";
import {PointInPolygonFilterOperatorComponent}
    from "./operators/point-in-polygon-filter.component";
import {HistogramOperatorComponent} from "./operators/histogram.component";
import {ROperatorComponent} from "./operators/r-operator.component";
import {MsgRadianceOperatorComponent, MsgReflectanceOperatorComponent, MsgSolarangleOperatorComponent, MsgTemperatureOperatorComponent, MsgPansharpenOperatorComponent, MsgCo2CorrectionOperatorComponent} from "./operators/msg-operators.component";
import {TimeRibbonComponent} from "./time-ribbon.component";

import {MATERIAL_DIRECTIVES, MdTabs} from "ng2-material/all";
@Component({
    selector: "tab-component",
    templateUrl: "templates/tab.html",
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
    directives: [MATERIAL_DIRECTIVES, TimeRibbonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabComponent implements AfterViewInit, AfterViewChecked {

    @ViewChild(MdTabs) tabs: MdTabs;

    private tabIndex$: BehaviorSubject<number>;

    @Input() layerSelected: boolean;

    @Output("zoomIn") zoomInEmitter = new EventEmitter<void>();

    @Output("zoomOut") zoomOutEmitter = new EventEmitter<void>();

    @Output("zoomLayer") zoomLayerEmitter = new EventEmitter<void>();

    @Output("zoomProject") zoomProjectEmitter = new EventEmitter<void>();

    @Output("zoomMap") zoomMapEmitter = new EventEmitter<void>();

    @Output("addData") addDataEmitter = new EventEmitter<void>();

    @Output("removeLayer") removeLayerEmitter = new EventEmitter<void>();

    @Output("renameLayer") renameLayerEmitter = new EventEmitter<void>();

    @Output() lineage = new EventEmitter<boolean>();

    @Output("symbology") symbologyEmitter = new EventEmitter<void>();

    @Output() showOperator = new EventEmitter<OperatorBase>();

    @Output() projectSettings = new EventEmitter<void>();

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private ngZone: NgZone,
                private storageService: StorageService) {
        this.tabIndex$ = new BehaviorSubject(this.storageService.getTabIndex());
        this.storageService.addTabIndexObservable(this.tabIndex$);
    }

    ngAfterViewInit() {
        // do this one time for ngMaterial
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        }, 0);
    }

    ngAfterViewChecked() {
        // publish tab index if changed
        let newTabIndex = this.tabs.selected;
        let oldTabIndex = this.tabIndex$.value;
        if (newTabIndex !== oldTabIndex) {
            this.tabIndex$.next(newTabIndex);
        }
    }

    private addExpressionOperator() {
        this.showOperator.emit(ExpressionOperatorComponent);
    }

    private addRasterValueExtractionOperator() {
        this.showOperator.emit(RasterValueExtractionOperatorComponent);
    }

    private addNumericAttributesFilterOperator() {
        this.showOperator.emit(NumericAttributeFilterOperatorComponent);
    }

    private addROperator() {
        this.showOperator.emit(ROperatorComponent);
    }

    private addHistogramOperator() {
        this.showOperator.emit(HistogramOperatorComponent);
    }

    private addPointInPolygonFilterOperator() {
        this.showOperator.emit(PointInPolygonFilterOperatorComponent);
    }

    private addMsgRadianceOperator() {
        this.showOperator.emit(MsgRadianceOperatorComponent);
    }

    private addMsgReflectanceOperator() {
        this.showOperator.emit(MsgReflectanceOperatorComponent);
    }

    private addMsgSolarangleOperator() {
        this.showOperator.emit(MsgSolarangleOperatorComponent);
    }

    private addMsgTemperatureOperator() {
        this.showOperator.emit(MsgTemperatureOperatorComponent);
    }

    private addMsgPansharpenOperator() {
        this.showOperator.emit(MsgPansharpenOperatorComponent);
    }

    private addMsgCo2CorrectionOperator() {
        this.showOperator.emit(MsgCo2CorrectionOperatorComponent);
    }
}
