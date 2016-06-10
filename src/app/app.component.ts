import {
    Component, ViewChild, ChangeDetectionStrategy, OnInit, AfterViewInit, ChangeDetectorRef,
} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {MD_SIDENAV_DIRECTIVES} from '@angular2-material/sidenav';
import {MD_TABS_DIRECTIVES, MdTabGroup} from '@angular2-material/tabs';

import {MATERIAL_DIRECTIVES, MATERIAL_BROWSER_PROVIDERS} from 'ng2-material';

import {ColorPickerService} from 'ct-angular2-color-picker/component';

import {InfoAreaComponent} from '../components/info-area.component';
import {RibbonsComponent} from '../ribbons/ribbons.component';
import {InfoBarComponent} from '../components/info-bar.component';
import {DataTableComponent} from '../components/data-table.component';
import {ProvenanceListComponent} from '../provenance/provenance.component';
import {RasterRepositoryComponent} from '../components/raster-repository.component';

import {Symbology} from '../symbology/symbology.model';
import {ResultTypes} from '../operators/result-type.model';

import {LayoutService} from '../app/layout.service';
import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {StorageService} from '../storage/storage.service';
import {MappingQueryService} from '../services/mapping-query.service';
import {RandomColorService} from '../services/random-color.service';

import {MapComponent} from '../map/map.component';
import {MapService} from '../map/map.service';
import {
    OlPointLayerComponent, OlLineLayerComponent, OlPolygonLayerComponent, OlRasterLayerComponent,
} from '../map/map-layer.component';

import {LayerListComponent} from '../layers/layer-list.component';
import {Layer} from '../layers/layer.model';
import {LayerService} from '../layers/layer.service';

import {PlotListComponent} from '../plots/plot-list.component';
import {PlotService} from '../plots/plot.service';

@Component({
    selector: 'wave-app',
    template: `
    <md-sidenav-layout fullscreen>
        <div class="topContainer md-whiteframe-3dp">
            <wave-info-area></wave-info-area>
            <wave-ribbons-component
                    (zoomIn)="mapComponent.zoomIn()" (zoomOut)="mapComponent.zoomOut()"
                    (zoomLayer)="mapComponent.zoomToLayer(getMapIndexOfSelectedLayer())"
                    (zoomMap)="mapComponent.zoomToMap()"
                    (addData)="rasterRepository.open()"
            ></wave-ribbons-component>
        </div>
        <div
            class="middleContainer"
            [style.height.px]="middleContainerHeight$ | async"
        >
            <wave-layer-list
                class="md-whiteframe-3dp"
                *ngIf="layerListVisible$ | async"
                [layers]="layers"
                [style.max-height.px]="middleContainerHeight$ | async"
            ></wave-layer-list>
            <wave-ol-map
                [height]="middleContainerHeight$ | async"
                [projection]="projectService.getProjectionStream() | async"
            >
                <template ngFor let-layer [ngForOf]='layersReverse$ | async'>
                    <template [ngIf]="layer.operator.resultType === ResultTypes.POINTS">
                        <wave-ol-point-layer
                            [layer]="layer"
                            [symbology]="layer.symbology"
                            [projection]="projectService.getProjectionStream() | async"
                            [time]="projectService.getTimeStream() | async"
                        ></wave-ol-point-layer>
                    </template>
                    <template [ngIf]="layer.operator.resultType === ResultTypes.LINES">
                        <wave-ol-line-layer
                            [layer]="layer"
                            [symbology]="layer.symbology"
                            [projection]="projectService.getProjectionStream() | async"
                            [time]="projectService.getTimeStream() | async"
                        ></wave-ol-line-layer>
                    </template>
                    <template [ngIf]="layer.operator.resultType === ResultTypes.POLYGONS">
                        <wave-ol-polygon-layer
                            [layer]="layer"
                            [symbology]="layer.symbology"
                            [projection]="projectService.getProjectionStream() | async"
                            [time]="projectService.getTimeStream() | async"
                        ></wave-ol-polygon-layer>
                    </template>
                    <template [ngIf]="layer.operator.resultType === ResultTypes.RASTER">
                        <wave-ol-raster-layer
                            [layer]="layer"
                            [symbology]="layer.symbology"
                            [projection]="projectService.getProjectionStream() | async"
                            [time]="projectService.getTimeStream() | async"
                        ></wave-ol-raster-layer>
                    </template>
                </template>
            </wave-ol-map>
            <wave-plot-list
                class="md-whiteframe-3dp"
                *ngIf="plotComponentVisible$ | async"
                [style.max-height.px]="middleContainerHeight$ | async"
                [maxHeight]="middleContainerHeight$ | async"
            ></wave-plot-list>
        </div>
        <div [style.height.px]="(bottomContainerHeight$ | async) + 48"
             class="bottomContainer md-whiteframe-3dp"
        >
            <div class="bottomToggle">
                <button md-button class="md-icon-button" aria-label="Toggle Data Table"
                        (click)="layoutService.toggleDataTableVisibility()"
                        [ngSwitch]="dataTableVisible$ | async"
                >
                    <i *ngSwitchWhen="true" md-icon>expand_more</i>
                    <i *ngSwitchWhen="false" md-icon>expand_less</i>
                </button>
                <md-divider></md-divider>
            </div>
            <md-tab-group>
                <md-tab>
                    <template md-tab-label>
                        <div (click)="setTabIndex(0)">Data Table</div>
                    </template>
                    <template md-tab-content>
                        <wave-data-table
                            *ngIf= "dataTableVisible$ | async"
                            [style.height.px]="(bottomContainerHeight$ | async)"
                            [height]="(bottomContainerHeight$ | async)">
                        </wave-data-table>
                    </template>
                </md-tab>
                <md-tab>
                    <template md-tab-label>
                        <div (click)="setTabIndex(1)">Citation</div>
                    </template>
                    <template md-tab-content>
                        <wave-provenance-list
                            *ngIf= "dataTableVisible$ | async"
                            [style.height.px]= "(bottomContainerHeight$ | async)"
                            [height]= "(bottomContainerHeight$ | async)"
                        ></wave-provenance-list>
                    </template>
                </md-tab>
            </md-tab-group>
        </div>
        <md-sidenav #rasterRepository align="end" layout="column" mode="over">
            <wave-raster-repository style='height:100%'
                *ngIf="rasterRepository.opened"
            ></wave-raster-repository>
        </md-sidenav>
    </md-sidenav-layout>
    `,
    styles: [`

    .bottomContainer {
        background: whitesmoke;
        min-height: 48px;
        position: relative;
        z-index: 1;
    }
    .bottomToggle {
        width: 48px;
        height: 41px;
        float: left;
        padding-top: 7px;
    }
    .bottomToggle button {
        height: 40px;
    }
    md-tab-group {
        float: left; width: calc(100% - 48px);
    }
    md-tab-group, md-tab-group >>> .md-tab-body-wrapper {
        min-height: 0 !important;
    }
    md-tab-group >>> .md-tab-header {
        height: 47px;
    }
    md-tab-group >>> .md-tab-body-wrapper {
        margin-left: -48px;
    }

    .topContainer {
        display: flex;
        height: 180px;
        width: 100%;
        flex-direction: row;
        position: relative;
        z-index: 1;
    }
    wave-info-area {
        width: 200px;
        min-width: 200px;
        height: 100%;
    }
    wave-ribbons-component {
        height: 100%;
        flex: 1 1 auto;
    }
    .middleContainer {
        position: relative;
        width: 100%;
    }
    wave-ol-map {
        width: 100%;
    }
    wave-layer-list,
    wave-plot-list {
        width: 200px;
        position: absolute;
        z-index: 1;
        overflow-y: auto;
        top: 0px;
    }
    wave-layer-list {
        left: 0px;
    }
    wave-plot-list {
        right: 0px;
    }
    wave-info-bar {
        position: relative;
        z-index: 1;
        min-height: 48px;
        height: 48px;
    }
    wave-data-table {
        width: 100%;
        overflow-y: auto;
    }
    `],
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_SIDENAV_DIRECTIVES, MD_TABS_DIRECTIVES,
        InfoAreaComponent, RibbonsComponent, LayerListComponent, InfoBarComponent,
        DataTableComponent, RasterRepositoryComponent, PlotListComponent,
        MapComponent, OlPointLayerComponent, OlLineLayerComponent, OlRasterLayerComponent,
        OlPolygonLayerComponent, ProvenanceListComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        MATERIAL_BROWSER_PROVIDERS,
        UserService, ProjectService, MappingQueryService, LayerService, PlotService, LayoutService,
        StorageService, RandomColorService, ColorPickerService, MapService,
    ],
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(MdTabGroup) bottomTabs: MdTabGroup;

    private layerListVisible$: Observable<boolean>;
    private plotComponentVisible$: Observable<boolean>;
    private dataTableVisible$: Observable<boolean>;

    private middleContainerHeight$: Observable<number>;
    private bottomContainerHeight$: Observable<number>;

    private layersReverse$: Observable<Array<Layer<Symbology>>>;
    private hasSelectedLayer$: Observable<boolean>;

    // for ng-switch
    private ResultTypes = ResultTypes; // tslint:disable-line:no-unused-variable variable-name

    constructor(
        private layerService: LayerService,
        private plotService: PlotService,
        private layoutService: LayoutService,
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService,
        private userService: UserService,
        private randomColorService: RandomColorService,
        private storageService: StorageService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.layersReverse$ = layerService.getLayersStream()
                                         .map(layers => layers.slice(0).reverse());

        this.hasSelectedLayer$ = layerService.getSelectedLayerStream()
                                             .map(value => value !== undefined);

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.plotComponentVisible$ = this.layoutService.getPlotComponentVisibilityStream();
        this.dataTableVisible$ = this.layoutService.getDataTableVisibilityStream();
    }

    ngOnInit() {
        const windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerHeight)
                  .subscribe(windowHeight$);

        const HEADER_HEIGHT = 180;
        const INFO_BAR_HEIGHT = 48;
        const remainingHeight$ = windowHeight$.map(
            height => Math.max(height - HEADER_HEIGHT - INFO_BAR_HEIGHT), 0
        );

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(remainingHeight$);
        this.bottomContainerHeight$ = this.layoutService.getDataTableHeightStream(remainingHeight$);
    }

    ngAfterViewInit() {
        // set the stored tab index
        this.layoutService.getFooterTabIndexStream().subscribe(tabIndex => {
            if (this.bottomTabs.selectedIndex !== tabIndex) {
                this.bottomTabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });
    }

    setTabIndex(index: number) {
        this.layoutService.setFooterTabIndex(index);
        this.layoutService.setDataTableVisibility(true);
    }

    getMapIndexOfSelectedLayer() {
        let layers = this.layerService.getLayers();
        let selectedLayer = this.layerService.getSelectedLayer();
        let index = layers.indexOf(selectedLayer);
        return layers.length - index - 1;
    }

}
