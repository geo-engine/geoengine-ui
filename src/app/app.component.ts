import {
    Component, ViewChild, OnInit, AfterViewInit, ChangeDetectionStrategy, HostListener, ChangeDetectorRef
} from '@angular/core';
import {MdTabGroup, MdSidenav} from '@angular/material';
import {Observable, BehaviorSubject} from 'rxjs/Rx';

import {Symbology} from '../symbology/symbology.model';
import {ResultTypes} from './operators/result-type.model';

import {LayoutService} from './layout.service';
import {NotificationService, NotificationType} from './notification.service';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';

import {ProjectService} from '../project/project.service';
import {UserService} from '../users/user.service';
import {StorageService} from '../storage/storage.service';
import {MappingQueryService} from '../queries/mapping-query.service';
import {RandomColorService} from '../services/random-color.service';

import {MapComponent} from '../map/map.component';

import {Layer} from '../layers/layer.model';
import {LayerService} from '../layers/layer.service';

import {PlotService} from '../plots/plot.service';


@Component({
    selector: 'wave-app',
    template: `
    <md-sidenav-container fullscreen>
        <div fxLayout="row">
            <wave-next-layer-list></wave-next-layer-list>
            <wave-top-toolbar fxFlex></wave-top-toolbar>
        </div>
        <!--
        <div class="topContainer md-whiteframe-3dp">
            <wave-info-area></wave-info-area>
            <wave-ribbons-component
                    (zoomIn)="mapComponent.zoomIn()" (zoomOut)="mapComponent.zoomOut()"
                    (zoomLayer)="mapComponent.zoomToLayer(getMapIndexOfSelectedLayer())"
                    (zoomMap)="mapComponent.zoomToMap()"
            ></wave-ribbons-component>
        </div>
        -->
        <div
            class="middleContainer"
            [style.height.px]="middleContainerHeight$ | async"
        >
            <wave-layer-list
                md-whiteframe
                *ngIf="layerListVisible$ | async"
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
                <button md-icon-button class="md-icon-button" aria-label="Toggle Data Table"
                        (click)="layoutService.toggleDataTableVisibility()"
                        [ngSwitch]="dataTableVisible$ | async"
                >
                    <md-icon *ngSwitchCase="true">expand_more</md-icon>
                    <md-icon *ngSwitchCase="false">expand_less</md-icon>
                </button>
                <md-divider></md-divider>
            </div>
            <md-tab-group>
                <md-tab>
                    <template md-tab-label>
                        <div (click)="setTabIndex(0)">Data Table</div>
                    </template>
                    <template md-tab-content>
                        <!--<wave-data-table
                            *ngIf= "dataTableVisible$ | async"
                            [style.height.px]="(bottomContainerHeight$ | async)"
                            [height]="(bottomContainerHeight$ | async)">
                        </wave-data-table>-->
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
        <wave-navigation></wave-navigation>
        <md-sidenav #sidenavRight align="end" mode="side">
            <wave-sidenav-container #sidenavContainer></wave-sidenav-container>
        </md-sidenav>
    </md-sidenav-container>
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    queries: {
        rightSidenav: new ViewChild(MdSidenav),
        rightSidenavContainer: new ViewChild(SidenavContainerComponent),
    },
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(MdTabGroup) bottomTabs: MdTabGroup;

    @ViewChild(MdSidenav) rightSidenav: MdSidenav;
    @ViewChild(SidenavContainerComponent) rightSidenavContainer: SidenavContainerComponent;

    layerListVisible$: Observable<boolean>;
    plotComponentVisible$: Observable<boolean>;
    dataTableVisible$: Observable<boolean>;

    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;

    layersReverse$: Observable<Array<Layer<Symbology>>>;
    hasSelectedLayer$: Observable<boolean>;

    // for ng-switch
    ResultTypes = ResultTypes; // tslint:disable-line:no-unused-variable variable-name

    constructor(
        public layerService: LayerService,
        private plotService: PlotService,
        public layoutService: LayoutService,
        private notificationService: NotificationService,
        public projectService: ProjectService,
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

        const HEADER_HEIGHT = 64;//180;
        const INFO_BAR_HEIGHT = 48;
        const remainingHeight$ = windowHeight$.map(
            height => Math.max(height - HEADER_HEIGHT - INFO_BAR_HEIGHT), 0
        );

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(remainingHeight$);
        this.bottomContainerHeight$ = this.layoutService.getDataTableHeightStream(remainingHeight$);
    }

    ngAfterViewInit() {
        this.layoutService.getSidenavContentComponentStream().subscribe(type => {
            this.rightSidenavContainer.load(type);
            if (type) {
                this.rightSidenav.open();
            } else {
                this.rightSidenav.close();
            }
        });

        // set the stored tab index
        this.layoutService.getFooterTabIndexStream().subscribe(tabIndex => {
            if (this.bottomTabs.selectedIndex !== tabIndex) {
                this.bottomTabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });

        // notify window parent that this component is ready
        if (parent !== window) {
            parent.postMessage({
                type: 'STATUS',
                status: 'READY',
            }, '*');
        }
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


    @HostListener('window:message', ['$event.data'])
    public handleMessage(message: { type: string }) {
        switch (message.type) {
            case 'TOKEN_LOGIN':
                const tokenMessage = message as { type: string, token: string };
                this.userService.gfbioTokenLogin(tokenMessage.token);
                break;
            default:
                // unhandled message
        }
    }

}
