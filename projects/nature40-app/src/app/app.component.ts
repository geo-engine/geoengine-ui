import {Observable, BehaviorSubject, fromEvent} from 'rxjs';
import {map, tap, first} from 'rxjs/operators';

import {transformExtent} from 'ol/proj';

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
    Layer,
    SidenavContainerComponent,
    MapContainerComponent,
    AbstractSymbology,
    LayerService,
    LayoutService,
    ProjectService,
    UserService,
    StorageService,
    RandomColorService,
    MappingQueryService,
    NotificationService,
    MapService,
    Config,
    ResultTypes,
    PlotListComponent,
    WorkflowParameterChoiceDialogComponent,
    NavigationButton,
    SourceOperatorListComponent,
    NavigationComponent,
    OperatorListComponent,
    TimeConfigComponent,
    WorkspaceSettingsComponent,
    HelpComponent,
    SourceOperatorListButton,
    GFBioSourceType,
    GbifOperatorComponent,
    OperatorListButtonGroups,
    SidenavConfig,
    Projections,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from './app-config.service';
import {Nature40UserService} from './users/nature40-user.service';
import {LoginComponent} from './users/login/login.component';
import {Nature40CatalogComponent} from './operators/dialogs/nature40-catalog/nature40-catalog.component';

@Component({
    selector: 'wave-nature40-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent: MapContainerComponent;
    @ViewChild(MatTabGroup, {static: true}) bottomTabs: MatTabGroup;

    @ViewChild(MatSidenav, {static: true}) rightSidenav: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer: SidenavContainerComponent;

    readonly ResultTypes = ResultTypes;
    readonly LayoutService = LayoutService;

    readonly layersReverse$: Observable<Array<Layer<AbstractSymbology>>>;
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
        readonly layerService: LayerService,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly vcRef: ViewContainerRef, // reference used by color picker
        @Inject(UserService) private readonly userService: Nature40UserService,
        private storageService: StorageService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog,
        private iconRegistry: MatIconRegistry,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private activatedRoute: ActivatedRoute,
        private notificationService: NotificationService,
        private mapService: MapService,
        private sanitizer: DomSanitizer,
    ) {
        this.registerIcons();

        vcRef.length; // tslint:disable-line:no-unused-expression // just get rid of unused warning

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream().pipe(map((layers) => layers.slice(0).reverse()));

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();

        this.setupInitialZoom();
    }

    private registerIcons() {
        this.iconRegistry.addSvgIconInNamespace('vat', 'logo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'));

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));

        this.iconRegistry.addSvgIconInNamespace(
            'nature40',
            'icon',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/natur_40_logo.svg'),
        );
    }

    ngOnInit() {
        this.mapService.registerMapComponent(this.mapComponent);
        this.mapIsGrid$ = this.mapService.isGrid$;

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(this.windowHeight$).pipe(tap(() => this.mapComponent.resize()));
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(this.windowHeight$);
    }

    ngAfterViewInit() {
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
        this.layoutService.getLayerDetailViewTabIndexStream().subscribe((tabIndex) => {
            if (this.bottomTabs.selectedIndex !== tabIndex) {
                this.bottomTabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });

        this.handleQueryParameters();
    }

    setTabIndex(index: number) {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    private setupNavigation(): Array<NavigationButton> {
        return [
            NavigationComponent.createLoginButton(this.userService, this.layoutService, this.config, {component: LoginComponent}),
            {
                sidenavConfig: AppComponent.setupAddDataConfig(),
                icon: 'add',
                tooltip: 'Add Data',
            },
            {
                sidenavConfig: AppComponent.setupOperatorListConfig(),
                icon: '',
                svgIcon: 'cogs',
                tooltip: 'Operators',
            },
            {
                sidenavConfig: {component: PlotListComponent, config: {operatorsListConfig: AppComponent.setupOperatorListConfig()}},
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
        return {component: SourceOperatorListComponent, config: {buttons: AppComponent.createSourceOperatorListButtons()}};
    }

    private static setupOperatorListConfig(): SidenavConfig {
        return {component: OperatorListComponent, config: {operators: AppComponent.createOperatorListButtons()}};
    }

    private static createSourceOperatorListButtons(): Array<SourceOperatorListButton> {
        return [
            SourceOperatorListComponent.createDataRepositoryButton(),
            {
                name: 'Nature 4.0 Catalog',
                description: 'Browse all the Nature 4.0 data',
                icon: 'nature_people',
                sidenavConfig: {component: Nature40CatalogComponent, keepParent: true},
                onlyIfLoggedIn: true,
            },
            {
                name: 'Nature 4.0 Catalog',
                description: 'Log in to browse all the Nature 4.0 data',
                icon: 'nature_people',
                sidenavConfig: undefined,
                onlyIfLoggedOut: true,
            },
            SourceOperatorListComponent.createDrawFeaturesButton(),
            ...SourceOperatorListComponent.createCustomFeaturesButtons(),
            {
                name: 'Species Occurrences',
                description: 'Query data from GBIF',
                iconSrc: GFBioSourceType.ICON_URL,
                sidenavConfig: {component: GbifOperatorComponent, keepParent: true},
            },
            SourceOperatorListComponent.createCountryPolygonsButton(),
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
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    private handleQueryParameters() {
        this.activatedRoute.queryParams.subscribe((p) => {
            for (const parameter of Object.keys(p)) {
                const value = p[parameter];
                switch (parameter) {
                    case 'workflow':
                        try {
                            const newLayer = Layer.fromDict(JSON.parse(value));
                            this.projectService
                                .getProjectStream()
                                .pipe(first())
                                .subscribe((project) => {
                                    if (project.layers.length > 0) {
                                        // show popup
                                        this.dialog.open(WorkflowParameterChoiceDialogComponent, {
                                            data: {
                                                dialogTitle: 'Workflow URL Parameter',
                                                sourceName: 'URL parameter',
                                                layers: [newLayer],
                                                nonAvailableNames: [],
                                                numberOfLayersInProject: project.layers.length,
                                            },
                                        });
                                    } else {
                                        // just add the layer if the layer array is empty
                                        this.projectService.addLayer(newLayer);
                                    }
                                });
                        } catch (error) {
                            this.notificationService.error(`Invalid Workflow: »${error}«`);
                        }
                        break;
                    case 'jws':
                    case 'jwt':
                        this.nature40JwtLogin(parameter, value);
                        break;
                    default:
                        this.notificationService.error(`Unknown URL Parameter »${parameter}«`);
                }
            }
        });
    }

    private nature40JwtLogin(parameter: string, token: string) {
        this.userService
            .nature40JwtTokenLogin(token)
            .pipe(first())
            .subscribe(
                (success) => {
                    if (success) {
                        this.notificationService.info(`Logged in using ${parameter.toUpperCase()}`);
                    } else {
                        this.notificationService.error(`Login with ${parameter.toUpperCase()} unsuccessful`);
                        // log out, because mapping session exists, but JWT token has become invalid
                        this.userService.guestLogin().pipe(first()).subscribe();
                    }
                },
                (error) => {
                    this.notificationService.error(`Cant handle provided ${parameter.toUpperCase()} parameters: »${error}«`);
                },
            );
    }

    /**
     * This handler stores the user viewport extent on leaving the app and retrieves it the next time.
     * The data is stored in local storage, s.th. it is not reflected using multiple browsers.
     * If there is no extent stored it uses the *Uniwald* extent as a starting point.
     */
    private setupInitialZoom() {
        const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');
        const storage_key = `${PATH_PREFIX}_zoom_extent`;

        let stored_extent: [number, number, number, number] = JSON.parse(localStorage.getItem(storage_key));

        if (!stored_extent) {
            stored_extent = this.config.NATURE40.DEFAULT_VIEW_BBOX;
        }

        this.projectService
            .getProjectionStream()
            .pipe(first())
            .subscribe((projection) => {
                const projectedExtent = transformExtent(
                    stored_extent,
                    Projections.WGS_84.getOpenlayersProjection(),
                    projection.getOpenlayersProjection(),
                );
                this.mapService.zoomTo(projectedExtent);
            });

        fromEvent(window, 'beforeunload').subscribe(() => {
            // store extent when leaving the site
            this.projectService
                .getProjectionStream()
                .pipe(first())
                .subscribe((projection) => {
                    const wgs84_extent: [number, number, number, number] = transformExtent(
                        this.mapService.getViewportSize().extent,
                        projection.getOpenlayersProjection(),
                        Projections.WGS_84.getOpenlayersProjection(),
                    );
                    localStorage.setItem(storage_key, JSON.stringify(wgs84_extent));
                });
        });
    }
}
