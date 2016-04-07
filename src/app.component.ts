import {Component, ViewChild, ElementRef, AfterViewInit, NgZone,
        ChangeDetectionStrategy, OnInit} from "angular2/core";
import {COMMON_DIRECTIVES} from "angular2/common";
import {HTTP_PROVIDERS} from "angular2/http";
import {BehaviorSubject, Subject, Observable} from "rxjs/Rx";
import {MATERIAL_DIRECTIVES, SidenavService, MdDialog} from "ng2-material/all";
import {MdDialogConfig, MdDialogBasic, MdDialogRef} from "ng2-material/components/dialog/dialog";

import {InfoAreaComponent} from "./info-area.component";
import {TabComponent} from "./tab.component";
import {InfoBarComponent} from "./info-bar.component";
import {LayerComponent} from "./layer.component";
import {DataTable} from "./data-table.component";
import {MapComponent} from "./openlayers/map.component";
import {PointLayerComponent, RasterLayerComponent} from "./openlayers/layer.component";

import {AddDataComponent} from "./add-data.component";

import {RenameLayerComponent, RenameLayerDialogConfig} from "./components/rename-layer.component";

import {Layer} from "./layer.model";
import {Operator, ResultType} from "./models/operator.model";

import {LayerService} from "./services/layer.service";
import {StorageService} from "./services/storage.service";

@Component({
    selector: "wave-app",
    template: `
    <div class="topContainer md-whiteframe-5dp" layout="row">
        <div class="infoArea">
            <info-area-component [layerListVisible]="layerListVisible$">
            </info-area-component>
        </div>
        <div flex="grow">
            <tab-component
                [layerSelected]="hasSelectedLayer$ | async"
                (renameLayer)="renameLayerDialog($event)"
                (removeLayer)="layerService.removeLayer(layerService.getSelectedLayerOnce())"
                (zoomIn)="mapComponent.zoomIn()" (zoomOut)="mapComponent.zoomOut()"
                (zoomLayer)="mapComponent.zoomToLayer(getMapIndexOfSelectedLayer())"
                (zoomMap)="mapComponent.zoomToMap()"
                (addData)="sidenavService.show('right')">
            </tab-component>
        </div>
    </div>
    <div class="middleContainer md-whiteframe-5dp" [style.height.px]="middleContainerHeight$ | async" layout="row">
        <div class="layers" *ngIf="layerListVisible$ | async" [style.max-height.px]="middleContainerHeight$ | async">
            <layer-component [layers]="layers">
            </layer-component>
        </div>
        <div flex="grow">
            <ol-map [height]="middleContainerHeight$ | async">
                <div *ngFor="#layer of layersReverse$ | async; #index = index"
                     [ngSwitch]="layer.resultType">
                    <ol-point-layer #olLayer *ngSwitchWhen="LAYER_IS_POINTS"
                                    [params]="layer.params"
                                    [style]="layer.style"></ol-point-layer>
                    <ol-raster-layer #olLayer *ngSwitchWhen="LAYER_IS_RASTER"
                                    [params]="layer.params"
                                    [style]="layer.style"></ol-raster-layer>
                </div>
            </ol-map>
        </div>
    </div>
    <div class="bottomContainer md-whiteframe-5dp"
        [style.height.px]="bottomContainerHeight$ | async">
        <md-toolbar class="infoBar">
            <info-bar-component [dataTableVisible]="dataTableVisible$">
            </info-bar-component>
        </md-toolbar>
        <div class="dataTable" [style.height.px]="(bottomContainerHeight$ | async) - 40" *ngIf="dataTableVisible$ | async">
            <wv-data-table>
            </wv-data-table>
        </div>
    </div>
    <md-sidenav-container>
        <md-sidenav name="right" align="right" layout="column"
                style="over">
            <add-data-component style="height:100%"></add-data-component>
        </md-sidenav>
    </md-sidenav-container>
    `,
    styles: [`
    .layers {
      position: absolute;
      z-index: 1;
      overflow-y: auto;
      box-shadow: 0 2px 5px 0 rgba(0,0,0,.26);
    }
    .dataTable {
      overflow-y: auto;
    }
    .topContainer {
        position: absolute;
        top: 0px;
        height: 180px;
        left: 0px;
        right: 0px;
    }
    .infoArea {
        width: 200px;
        min-width: 200px;
    }
    .middleContainer {
        position: absolute;
        top: 180px;
        left: 0px;
        right: 0px;
    }
    .middleContainer .layers {
        width: 200px;
    }
    .bottomContainer {
        position: absolute;
        bottom: 0px;
        left: 0px;
        right: 0px;


    }
    .bottomContainer .infoBar {
        min-height: 40px;
        height: 40px;
    }
    `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, InfoAreaComponent, TabComponent,
                 LayerComponent, MapComponent, PointLayerComponent, RasterLayerComponent,
                 InfoBarComponent, DataTable, AddDataComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [LayerService, StorageService, SidenavService, HTTP_PROVIDERS, MdDialog]
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapComponent)
    private mapComponent: MapComponent;

    private layerListVisible$: BehaviorSubject<boolean>;
    private dataTableVisible$: BehaviorSubject<boolean>;

    private middleContainerHeight$: Observable<number>;
    private bottomContainerHeight$: Observable<number>;

    private layersReverse$: Observable<Array<Layer>>;
    private hasSelectedLayer$: Observable<boolean>;

    // for ng-switch
    private LAYER_IS_POINTS = ResultType.POINTS;
    private LAYER_IS_RASTER = ResultType.RASTER;

    constructor(private zone: NgZone,
                private layerService: LayerService,
                private sidenavService: SidenavService,
                private storageService: StorageService,
                private mdDialog: MdDialog,
                private elementRef: ElementRef) {
        this.layersReverse$ = layerService.getLayers()
                                         .map(layers => layers.slice(0).reverse());

        this.hasSelectedLayer$ = layerService.getSelectedLayer()
                                             .map(value => value !== undefined);

        // attach layer list visibility to storage service
        this.layerListVisible$ = new BehaviorSubject(this.storageService.getLayerListVisible());
        this.storageService.addLayerListVisibleObservable(this.layerListVisible$);

        // attach data table visibility to storage service
        this.dataTableVisible$ = new BehaviorSubject(this.storageService.getDataTableVisible());
        this.storageService.addDataTableVisibleObservable(this.dataTableVisible$);
    }

    ngOnInit() {
        let windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, "resize")
                  .map(_ => window.innerHeight)
                  .subscribe(windowHeight$);
        this.layerListVisible$.map(() => window.innerHeight)
                              .subscribe(windowHeight$);
        this.dataTableVisible$.map(() => window.innerHeight)
                              .subscribe(windowHeight$);

        let remainingHeight$ = windowHeight$.map(height => height - 180)
                                            .map(height => Math.max(height, 0));

        this.middleContainerHeight$ = remainingHeight$.map(height => {
            if (this.dataTableVisible$.getValue()) {
                return Math.ceil(3 / 5 * height);
            } else {
                return Math.max(height - 40, 0);
            }
        });

        this.bottomContainerHeight$ = remainingHeight$.map(height => {
            if (this.dataTableVisible$.getValue()) {
                return Math.floor(2 / 5 * height);
            } else {
                return 40;
            }
        });
    }

    ngAfterViewInit() {
        this.middleContainerHeight$.subscribe(() => {
            this.mapComponent.resize();
        });

        this.bottomContainerHeight$.subscribe(() => {
            this.mapComponent.resize();
        });
    }

    getMapIndexOfSelectedLayer() {
        let layers = this.layerService.getLayersOnce();
        let selectedLayer = this.layerService.getSelectedLayerOnce();
        let index = layers.indexOf(selectedLayer);
        return layers.length - index - 1;
    }

    private renameLayerDialog(event: Event) {
        let config = new RenameLayerDialogConfig()
            .layerService(this.layerService)
            .clickOutsideToClose(true)
            .targetEvent(event);

        this.mdDialog.open(RenameLayerComponent, this.elementRef, config);
    }
}
