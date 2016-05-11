import {Component, ViewChild, ElementRef, AfterViewInit, NgZone,
        ChangeDetectionStrategy, OnInit} from "angular2/core";
import {COMMON_DIRECTIVES} from "angular2/common";
import {HTTP_PROVIDERS} from "angular2/http";
import {BehaviorSubject, Subject, Observable} from "rxjs/Rx";
import {MATERIAL_DIRECTIVES, SidenavService, MdDialog} from "ng2-material/all";
import {MdDialogConfig, MdDialogBasic, MdDialogRef} from "ng2-material/components/dialog/dialog";

import {InfoAreaComponent} from "../components/info-area.component";
import {TabComponent} from "../components/tab.component";
import {InfoBarComponent} from "../components/info-bar.component";
import {LayerComponent} from "../components/layer.component";
import {DataTable} from "../components/data-table.component";
import {OlMapComponent} from "./openlayers/ol-map.component";
import {OlPointLayerComponent, OlLineLayerComponent, OlPolygonLayerComponent,
        OlRasterLayerComponent} from "./openlayers/ol-layer.component";
import {PlotListComponent} from "./plots/plot-list.component";

import {RasterRepositoryComponent} from "../components/raster-repository.component";
import {OperatorBaseComponent, OperatorBase, OperatorDialogConfig}
    from "../components/operators/operator.component";

import {RenameLayerComponent, RenameLayerDialogConfig}
    from "../components/rename-layer.component";
import {ProjectSettingsComponent, ProjectSettingsDialogConfig}
    from "../components/project-settings.component";
import {OperatorGraphDialogComponent, OperatorGraphDialogConfig}
    from "../components/dialogs/operator-graph.component";
import {SymbologyDialogComponent, SymbologyDialogConfig}
    from "../components/dialogs/symbology-dialog.component";

import {Layer} from "../models/layer.model";
import {Operator} from "../models/operator.model";
import {ResultTypes} from "../models/result-type.model";
import {Projection} from "../models/projection.model";

import {LayerService} from "../services/layer.service";
import {PlotService} from "../services/plot.service";
import {StorageService} from "../services/storage.service";
import {ProjectService} from "../services/project.service";
import {UserService} from "../services/user.service";
import {MappingQueryService} from "../services/mapping-query.service";
import {MappingColorizerService} from "../services/mapping-colorizer.service";

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
                (removeLayer)="layerService.removeLayer(layerService.getSelectedLayer())"
                (lineage)="showLineage($event)"
                (zoomIn)="mapComponent.zoomIn()" (zoomOut)="mapComponent.zoomOut()"
                (zoomLayer)="mapComponent.zoomToLayer(getMapIndexOfSelectedLayer())"
                (zoomMap)="mapComponent.zoomToMap()"
                (addData)="sidenavService.show('right')"
                (showOperator)="showAddOperatorDialog($event)"
                (projectSettings)="projectSettingsDialog($event)"
                (symbology)="symbologyDialog($event)">
            </tab-component>
        </div>
    </div>
    <div class="middleContainer md-whiteframe-5dp" layout="row"
         [style.height.px]="middleContainerHeight$ | async">
        <div class="layers" *ngIf="layerListVisible$ | async"
             [style.max-height.px]="middleContainerHeight$ | async">
            <layer-component [layers]="layers">
            </layer-component>
        </div>
        <div flex="grow">
            <ol-map [height]="middleContainerHeight$ | async"
                    [projection]="projectService.getMapProjectionStream() | async">
                <div *ngFor="#layer of layersReverse$ | async; #index = index"
                     [ngSwitch]="layer.operator.resultType">
                    <ol-point-layer #olLayer *ngSwitchWhen="ResultTypes.POINTS"
                                    [operator]="layer.operator"
                                    [symbology]="layer.symbology"
                                    [projection]="projectService.getMapProjectionStream() | async"
                                    [time]="projectService.getTimeStream() | async">
                    </ol-point-layer>
                    <ol-line-layer #olLayer *ngSwitchWhen="ResultTypes.LINES"
                                   [operator]="layer.operator"
                                   [symbology]="layer.symbology"
                                   [projection]="projectService.getMapProjectionStream() | async"
                                   [time]="projectService.getTimeStream() | async">
                    </ol-line-layer>
                    <ol-polygon-layer #olLayer *ngSwitchWhen="ResultTypes.POLYGONS"
                                      [operator]="layer.operator"
                                      [symbology]="layer.symbology"
                                      [projection]="projectService.getMapProjectionStream() | async"
                                      [time]="projectService.getTimeStream() | async">
                    </ol-polygon-layer>
                    <ol-raster-layer #olLayer *ngSwitchWhen="ResultTypes.RASTER"
                                     [operator]="layer.operator"
                                     [symbology]="layer.symbology"
                                     [projection]="projectService.getMapProjectionStream() | async"
                                     [time]="projectService.getTimeStream() | async">
                    </ol-raster-layer>
                </div>
            </ol-map>
        </div>
        <wave-plot-list class="plots" [maxHeight]="middleContainerHeight$ | async"></wave-plot-list>
    </div>
    <div class="bottomContainer md-whiteframe-5dp"
        [style.height.px]="bottomContainerHeight$ | async">
        <md-toolbar class="infoBar">
            <info-bar-component [dataTableVisible]="dataTableVisible$">
            </info-bar-component>
        </md-toolbar>
        <div class="dataTable" [style.height.px]="(bottomContainerHeight$ | async) - 40"
             *ngIf="dataTableVisible$ | async">
            <wv-data-table [height]="(bottomContainerHeight$ | async) - 40">
            </wv-data-table>
        </div>
    </div>
    <md-sidenav-container>
        <md-sidenav name="right" align="right" layout="column"
                style="over">
            <raster-repository-component style="height:100%"></raster-repository-component>
        </md-sidenav>
    </md-sidenav-container>
    `,
    styles: [`
    .topContainer {
        position: absolute;
        top: 0px;
        height: 180px;
        left: 0px;
        right: 0px;
    }
    .topContainer .infoArea {
        width: 200px;
        min-width: 200px;
    }
    .middleContainer {
        position: absolute;
        top: 180px;
        left: 0px;
        right: 0px;
    }
    .middleContainer .layers, .middleContainer .plots {
        width: 200px;
        position: absolute;
        z-index: 1;
        overflow-y: auto;
        box-shadow: 0 2px 5px 0 rgba(0,0,0,.26);
    }
    .middleContainer .plots {
        right: 0px;
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
    .bottomContainer .dataTable {
      overflow-y: auto;
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES,
        InfoAreaComponent, TabComponent, LayerComponent, InfoBarComponent, DataTable,
        RasterRepositoryComponent, PlotListComponent,
        OlMapComponent, OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
        OlPolygonLayerComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [LayerService, PlotService, StorageService, ProjectService, UserService,
                MappingQueryService, MappingColorizerService,
                SidenavService, HTTP_PROVIDERS, MdDialog]
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(OlMapComponent)
    private mapComponent: OlMapComponent;

    private layerListVisible$: BehaviorSubject<boolean>;
    private plotListVisible$: BehaviorSubject<boolean>;
    private dataTableVisible$: BehaviorSubject<boolean>;

    private middleContainerHeight$: Observable<number>;
    private bottomContainerHeight$: Observable<number>;

    private layersReverse$: Observable<Array<Layer>>;
    private hasSelectedLayer$: Observable<boolean>;

    private mapProjection$: Observable<Projection>;

    // for ng-switch
    private ResultTypes = ResultTypes;

    constructor(private zone: NgZone,
                private layerService: LayerService,
                private plotService: PlotService,
                private sidenavService: SidenavService,
                private storageService: StorageService,
                private projectService: ProjectService,
                private mappingQueryService: MappingQueryService,
                private userService: UserService,
                private mdDialog: MdDialog,
                private elementRef: ElementRef,
                private mappingColorizerService: MappingColorizerService) {
        this.layersReverse$ = layerService.getLayersStream()
                                         .map(layers => layers.slice(0).reverse());

        this.hasSelectedLayer$ = layerService.getSelectedLayerStream()
                                             .map(value => value !== undefined);

        // attach layer list visibility to storage service
        this.layerListVisible$ = new BehaviorSubject(this.storageService.getLayerListVisible());
        this.storageService.addLayerListVisibleObservable(this.layerListVisible$);

        // plot list visiblity
        this.plotListVisible$ = new BehaviorSubject(false);
        this.plotService.getPlotsStream()
                        .map(plots => plots.length > 0)
                        .subscribe(this.plotListVisible$);

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
            // this.mapComponent.resize();
        });

        this.bottomContainerHeight$.subscribe(() => {
            // this.mapComponent.resize();
        });
    }

    getMapIndexOfSelectedLayer() {
        let layers = this.layerService.getLayers();
        let selectedLayer = this.layerService.getSelectedLayer();
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

    private projectSettingsDialog(event: Event) {
        let config = new ProjectSettingsDialogConfig()
            .projectService(this.projectService)
            .clickOutsideToClose(true)
            .targetEvent(event);

        this.mdDialog.open(ProjectSettingsComponent, this.elementRef, config);
    }

    private showAddOperatorDialog(OperatorComponent: OperatorBase) {
        let config = new OperatorDialogConfig()
            .layerService(this.layerService)
            .plotService(this.plotService)
            .projectService(this.projectService)
            .mappingQueryService(this.mappingQueryService)
            .mappingColorizerService(this.mappingColorizerService)
            .clickOutsideToClose(true);

        this.mdDialog.open(<Function> OperatorComponent, this.elementRef, config);
    }

    private showLineage(selectedLayerOnly: boolean) {
        let config = new OperatorGraphDialogConfig()
            .layerService(this.layerService)
            .selectedLayerOnly(selectedLayerOnly)
            .clickOutsideToClose(true);

        this.mdDialog.open(OperatorGraphDialogComponent, this.elementRef, config);
    }

    private symbologyDialog(event: Event) {
        let config = new SymbologyDialogConfig()
          .layerService(this.layerService)
          .clickOutsideToClose(true)
          .targetEvent(event);

        this.mdDialog.open(SymbologyDialogComponent, this.elementRef, config);
    }
}
