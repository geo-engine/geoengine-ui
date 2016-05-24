import {
    Component, ViewChild, ElementRef, NgZone, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';
import {HTTP_PROVIDERS} from '@angular/http';
import {BehaviorSubject, Observable} from 'rxjs/Rx';
import {MD_SIDENAV_DIRECTIVES} from '@angular2-material/sidenav';
import {MATERIAL_DIRECTIVES, MdDialog} from 'ng2-material';

import {InfoAreaComponent} from '../components/info-area.component';
import {RibbonsComponent} from '../ribbons/ribbons.component';
import {InfoBarComponent} from '../components/info-bar.component';
import {LayerComponent} from '../components/layer.component';
import {DataTableComponent} from '../components/data-table.component';
import {OlMapComponent} from './openlayers/ol-map.component';
import {
    OlPointLayerComponent, OlLineLayerComponent, OlPolygonLayerComponent, OlRasterLayerComponent,
} from './openlayers/ol-layer.component';

import {RasterRepositoryComponent} from '../components/raster-repository.component';

import {Layer} from '../models/layer.model';
import {Symbology} from '../symbology/symbology.model';
import {ResultTypes} from '../operators/result-type.model';

import {LayerService} from '../services/layer.service';
import {LayoutService} from '../app/layout.service';
import {ProjectService} from '../services/project.service';
import {UserService} from '../users/user.service';
import {MappingQueryService} from '../services/mapping-query.service';
import {RandomColorService} from '../services/random-color.service';

import {PlotListComponent} from '../plots/plot-list.component';

import {PlotService} from '../plots/plot.service';

@Component({
    selector: 'wave-app',
    template: `
    <md-sidenav-layout>
        <div class="topContainer md-whiteframe-5dp" layout="row">
            <div class="infoArea">
                <wave-info-area></wave-info-area>
            </div>
            <div flex="grow">
                <wave-ribbons-component
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
                </wave-ribbons-component>
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
                <wave-ol-map [height]="middleContainerHeight$ | async"
                        [projection]="projectService.getMapProjectionStream() | async">
                    <div *ngFor="let layer of layersReverse$ | async; #index = index"
                         [ngSwitch]="layer.operator.resultType">
                        <wave-ol-point-layer #olLayer *ngSwitchWhen="ResultTypes.POINTS"
                                        [layer]="layer"
                                        [symbology]="layer.symbology"
                                        [projection]="projectService.getMapProjectionStream() | async"
                                        [time]="projectService.getTimeStream() | async"
                                        >
                        </wave-ol-point-layer>
                        <wave-ol-line-layer #olLayer *ngSwitchWhen="ResultTypes.LINES"
                                        [layer]="layer"
                                        [symbology]="layer.symbology"
                                        [projection]="projectService.getMapProjectionStream() | async"
                                        [time]="projectService.getTimeStream() | async"
                                       >
                        </wave-ol-line-layer>
                        <wave-ol-polygon-layer #olLayer *ngSwitchWhen="ResultTypes.POLYGONS"
                                        [layer]="layer"
                                        [symbology]="layer.symbology"
                                        [projection]="projectService.getMapProjectionStream() | async"
                                        [time]="projectService.getTimeStream() | async"
                                          >
                        </wave-ol-polygon-layer>
                        <wave-ol-raster-layer #olLayer *ngSwitchWhen="ResultTypes.RASTER"
                                        [layer]="layer"
                                        [symbology]="layer.symbology"
                                        [projection]="projectService.getMapProjectionStream() | async"
                                        [time]="projectService.getTimeStream() | async">
                        </wave-ol-raster-layer>
                    </div>
                </wave-ol-map>
            </div>
            <wave-plot-list class="plots" [maxHeight]="middleContainerHeight$ | async"
                            (openDetailView)="showPlotDetailDialog($event)"></wave-plot-list>
        </div>
        <div class="bottomContainer md-whiteframe-5dp"
            [style.height.px]="bottomContainerHeight$ | async">
            <wave-info-bar></wave-info-bar>
            <div class="dataTable" [style.height.px]="(bottomContainerHeight$ | async) - 40"
                 *ngIf="dataTableVisible$ | async">
                <wave-data-table [height]="(bottomContainerHeight$ | async) - 40">
                </wave-data-table>
            </div>
        </div>
        <md-sidenav #right layout="column" mode="over">
            <wave-raster-repository style='height:100%'></wave-raster-repository>
        </md-sidenav>
    </md-sidenav-layout>
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
        height: 100%;
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
    wave-info-bar {
        min-height: 40px;
        height: 40px;
    }
    .bottomContainer .dataTable {
        overflow-y: auto;
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_SIDENAV_DIRECTIVES,
        InfoAreaComponent, RibbonsComponent, LayerComponent, InfoBarComponent, DataTableComponent,
        RasterRepositoryComponent, PlotListComponent,
        OlMapComponent, OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
        OlPolygonLayerComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        HTTP_PROVIDERS, MdDialog,
        LayerService, PlotService, LayoutService, ProjectService, UserService, MappingQueryService,
        RandomColorService,
    ],
})
export class AppComponent implements OnInit {
    @ViewChild(OlMapComponent) mapComponent: OlMapComponent;

    private layerListVisible$: Observable<boolean>;
    private dataTableVisible$: Observable<boolean>;

    private middleContainerHeight$: Observable<number>;
    private bottomContainerHeight$: Observable<number>;

    private layersReverse$: Observable<Array<Layer<Symbology>>>;
    private hasSelectedLayer$: Observable<boolean>;

    // for ng-switch
    private ResultTypes = ResultTypes; // tslint:disable-line:no-unused-variable variable-name

    constructor(private zone: NgZone,
                private layerService: LayerService,
                private plotService: PlotService,
                private layoutService: LayoutService,
                private projectService: ProjectService,
                private mappingQueryService: MappingQueryService,
                private userService: UserService,
                private mdDialog: MdDialog,
                private elementRef: ElementRef,
                private randomColorService: RandomColorService) {
        this.layersReverse$ = layerService.getLayersStream()
                                         .map(layers => layers.slice(0).reverse());

        this.hasSelectedLayer$ = layerService.getSelectedLayerStream()
                                             .map(value => value !== undefined);

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.dataTableVisible$ = this.layoutService.getDataTableVisibilityStream();
    }

    ngOnInit() {
        const windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerHeight)
                  .subscribe(windowHeight$);

        const HEADER_HEIGHT = 180;
        const remainingHeight$ = windowHeight$.map(height => Math.max(height - HEADER_HEIGHT), 0);

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(remainingHeight$);
        this.bottomContainerHeight$ = this.layoutService.getDataTableHeightStream(remainingHeight$);
    }

    getMapIndexOfSelectedLayer() {
        let layers = this.layerService.getLayers();
        let selectedLayer = this.layerService.getSelectedLayer();
        let index = layers.indexOf(selectedLayer);
        return layers.length - index - 1;
    }

}
