import {Observable, BehaviorSubject} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener,
    Inject,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenav} from '@angular/material/sidenav';
import {MatTabGroup} from '@angular/material/tabs';
import {
    AddDataComponent,
    AddDataButton,
    Layer,
    SidenavContainerComponent,
    LayoutService,
    UserService,
    RandomColorService,
    NotificationService,
    Config,
    ProjectService,
    NavigationButton,
    NavigationComponent,
    MapService,
    MapContainerComponent,
    WorkspaceSettingsComponent,
    OperatorListComponent,
    OperatorListButtonGroups,
    TimeConfigComponent,
    PlotListComponent,
    SidenavConfig,
    SpatialReferenceService,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from './app-config.service';
import {HelpComponent} from './help/help.component';

@Component({
    selector: 'wave-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;
    @ViewChild(MatTabGroup, {static: true}) bottomTabs!: MatTabGroup;

    @ViewChild(MatSidenav, {static: true}) rightSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer!: SidenavContainerComponent;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly layerListVisible$: Observable<boolean>;
    readonly layerDetailViewVisible$: Observable<boolean>;

    readonly navigationButtons = this.setupNavigation();
    readonly addAFirstLayerConfig = AppComponent.setupAddDataConfig();

    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;
    mapIsGrid$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly vcRef: ViewContainerRef, // reference used by color picker
        private userService: UserService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog,
        private iconRegistry: MatIconRegistry,
        private randomColorService: RandomColorService,
        private activatedRoute: ActivatedRoute,
        private notificationService: NotificationService,
        private mapService: MapService,
        private spatialReferenceService: SpatialReferenceService,
        private sanitizer: DomSanitizer,
    ) {
        this.registerIcons();

        vcRef.length; // eslint-disable-line @typescript-eslint/no-unused-expressions

        this.layersReverse$ = this.projectService.getLayerStream().pipe(map((layers) => layers.slice(0).reverse()));

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();

        this.mapIsGrid$ = this.mapService.isGrid$;

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(this.windowHeight$).pipe(tap(() => this.mapComponent.resize()));
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(this.windowHeight$);
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);

        // TODO: remove if table is back
        this.layoutService.setLayerDetailViewVisibility(false);
    }

    ngAfterViewInit(): void {
        this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.rightSidenavContainer.load(sidenavConfig);
            if (sidenavConfig) {
                this.rightSidenav.open();
            } else {
                this.rightSidenav.close();
            }
        });
        this.projectService
            .getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        // set the stored tab index
        // this.layoutService.getLayerDetailViewTabIndexStream().subscribe(tabIndex => {
        //     if (this.bottomTabs.selectedIndex !== tabIndex) {
        //         this.bottomTabs.selectedIndex = tabIndex;
        //         setTimeout(() => this.changeDetectorRef.markForCheck());
        //     }
        // });

        // this.handleQueryParameters();
    }

    setTabIndex(index: number): void {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace('vat', 'logo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'));

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    private setupNavigation(): Array<NavigationButton> {
        return [
            NavigationComponent.createLoginButton(this.userService, this.layoutService, this.config),
            {
                sidenavConfig: AppComponent.setupAddDataConfig(),
                icon: 'add',
                tooltip: 'Add Data',
            },
            {
                sidenavConfig: {component: OperatorListComponent, config: {operators: AppComponent.createOperatorListButtons()}},
                icon: '',
                svgIcon: 'cogs',
                tooltip: 'Operators',
            },
            {
                sidenavConfig: {component: PlotListComponent},
                icon: 'equalizer',
                tooltip: 'Plots',
            },
            {
                sidenavConfig: {component: TimeConfigComponent},
                icon: 'access_time',
                tooltip: 'Time',
            },
            {
                sidenavConfig: {component: WorkspaceSettingsComponent},
                icon: 'settings',
                tooltip: 'Workspace',
            },
            {
                sidenavConfig: {component: HelpComponent},
                icon: 'help',
                tooltip: 'Help',
            },
        ];
    }

    private static setupAddDataConfig(): SidenavConfig {
        return {component: AddDataComponent, config: {buttons: AppComponent.createAddDataListButtons()}};
    }

    private static createAddDataListButtons(): Array<AddDataButton> {
        return [
            AddDataComponent.createDatasetListButton(),
            AddDataComponent.createExternalDataButton(),
            AddDataComponent.createUploadButton(),
            AddDataComponent.createDrawFeaturesButton(),
            AddDataComponent.createAddWorkflowByIdButton(),

            // ...SourceOperatorListComponent.createCustomFeaturesButtons(),
            // {
            //     name: 'Species Occurrences',
            //     description: 'Query data from GBIF',
            //     iconSrc: GFBioSourceType.ICON_URL,
            //     sidenavConfig: {component: GbifOperatorComponent, keepParent: true},
            // },
            // SourceOperatorListComponent.createCountryPolygonsButton(),
        ];
    }

    private static createOperatorListButtons(): OperatorListButtonGroups {
        return [
            {name: 'Mixed', list: OperatorListComponent.DEFAULT_MIXED_OPERATOR_DIALOGS},
            {name: 'Plots', list: OperatorListComponent.DEFAULT_PLOT_OPERATOR_DIALOGS},
            {name: 'Raster', list: OperatorListComponent.DEFAULT_RASTER_OPERATOR_DIALOGS},
            {name: 'Vector', list: OperatorListComponent.DEFAULT_VECTOR_OPERATOR_DIALOGS},
        ];
    }

    @HostListener('window:resize')
    private windowHeight(): void {
        this.windowHeight$.next(window.innerHeight);
    }

    // private handleQueryParameters() {
    //     this.activatedRoute.queryParams.subscribe(p => {
    //         for (const parameter of Object.keys(p)) {
    //             const value = p[parameter];
    //             switch (parameter) {
    //                 case 'workflow':
    //                     try {
    //                         const newLayer = Layer.fromDict(JSON.parse(value));
    //                         this.projectService.getProjectStream().pipe(first()).subscribe(project => {
    //                             if (project.layers.length > 0) {
    //                                 // show popup
    //                                 this.dialog.open(WorkflowParameterChoiceDialogComponent, {
    //                                     data: {
    //                                         dialogTitle: 'Workflow URL Parameter',
    //                                         sourceName: 'URL parameter',
    //                                         layers: [newLayer],
    //                                         nonAvailableNames: [],
    //                                         numberOfLayersInProject: project.layers.length,
    //                                     }
    //                                 });
    //                             } else {
    //                                 // just add the layer if the layer array is empty
    //                                 this.projectService.addLayer(newLayer);
    //                             }
    //                         });
    //                     } catch (error) {
    //                         this.notificationService.error(`Invalid Workflow: »${error}«`);
    //                     }
    //                     break;
    //                 default:
    //                     this.notificationService.error(`Unknown URL Parameter »${parameter}«`);
    //             }
    //         }
    //     });
    // }
}
