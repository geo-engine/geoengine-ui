import {Observable, BehaviorSubject, of as observableOf, from as observableFrom, combineLatest, partition} from 'rxjs';
import {toArray, map, tap, first, mergeMap, filter} from 'rxjs/operators';

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
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';

import {MatDialog} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenav} from '@angular/material/sidenav';
import {MatTabGroup} from '@angular/material/tabs';

import {
    Layer,
    SidenavContainerComponent,
    VectorLayer,
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
    PointSymbology,
    VectorSymbology,
    PlotListComponent,
    UnexpectedResultType,
    Operator,
    AbstractVectorSymbology,
    WorkflowParameterChoiceDialogComponent,
    NavigationButton,
    SourceOperatorListComponent,
    NavigationComponent,
    OperatorListComponent,
    TimeConfigComponent,
    WorkspaceSettingsComponent,
    SourceOperatorListButton,
    GFBioSourceType,
    GbifOperatorComponent,
    OperatorListButtonGroups,
    SidenavConfig,
} from 'wave-core';

import {AppConfig} from './app-config.service';
import {GFBioMappingQueryService} from './queries/mapping-query.service';
import {GFBioUserService} from './users/user.service';
import {
    BasketAvailability,
    BasketResult,
    IBasketGroupedAbcdResult,
    IBasketPangaeaResult,
} from './operators/dialogs/baskets/gfbio-basket.model';
import {GroupedAbcdBasketResultComponent} from './operators/dialogs/baskets/grouped-abcd-basket-result/grouped-abcd-basket-result.component';
import {PangaeaBasketResultComponent} from './operators/dialogs/baskets/pangaea-basket-result/pangaea-basket-result.component';
import {TerminologyLookupOperatorComponent} from './operators/dialogs/terminology-lookup/terminology-lookup.component';
import {TerminologyLookupType} from './operators/types/terminology-lookup-type';
import {LoginComponent} from './login/login.component';
import {AbcdRepositoryComponent} from './operators/dialogs/abcd-repository/abcd-repository.component';
import {ABCDSourceType} from './operators/types/abcd-source-type.model';
import {GfbioBasketsComponent} from './operators/dialogs/baskets/gfbio-baskets.component';
import {SplashDialogComponent} from './dialogs/splash-dialog/splash-dialog.component';
import {HelpComponent} from './help/help.component';
import {Location} from '@angular/common';

@Component({
    selector: 'wave-gfbio-root',
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
        @Inject(UserService) private readonly userService: GFBioUserService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly iconRegistry: MatIconRegistry,
        private readonly randomColorService: RandomColorService,
        @Inject(MappingQueryService) private readonly mappingQueryService: GFBioMappingQueryService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        private readonly location: Location,
        private readonly notificationService: NotificationService,
        private readonly mapService: MapService,
        private readonly sanitizer: DomSanitizer,
    ) {
        this.registerIcons();

        vcRef.length; // tslint:disable-line:no-unused-expression // just get rid of unused warning

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream().pipe(map((layers) => layers.slice(0).reverse()));

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();
    }

    private registerIcons() {
        this.iconRegistry.addSvgIconInNamespace('vat', 'logo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'));

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
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

        // show splash screen
        if (this.userService.shouldShowIntroductoryPopup()) {
            setTimeout(() => {
                this.dialog.open(SplashDialogComponent, {});
            });
        }

        // notify window parent that this component is ready
        if (parent !== window) {
            parent.postMessage(
                {
                    type: 'STATUS',
                    status: 'READY',
                },
                '*',
            );
        } else {
            // handle query parameters directly if it is not embedded and using an auto login
            this.handleQueryParameters();
        }
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
                name: 'ABCD Archives',
                description: 'Lookup GFBio ABCD archive',
                iconSrc: ABCDSourceType.ICON_URL,
                sidenavConfig: {component: AbcdRepositoryComponent, keepParent: true},
            },
            {
                name: 'GFBio Search Baskets',
                description: 'Display your GFBio search results',
                icon: 'add_shopping_cart',
                sidenavConfig: {component: GfbioBasketsComponent, keepParent: true},
                onlyIfLoggedIn: true,
            },
            {
                name: 'GFBio Search Baskets',
                description: 'Log in to display your GFBio search results',
                icon: 'add_shopping_cart',
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
            {
                name: 'Vector',
                list: [
                    ...OperatorListComponent.DEFAULT_VECTOR_OPERATOR_DIALOGS,
                    {
                        component: TerminologyLookupOperatorComponent,
                        type: TerminologyLookupType,
                        description: 'Augment attributes via the GFBio Terminology Service',
                    },
                ],
            },
        ];
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    private handleQueryParameters() {
        // If the GFBio SSO sends a link with `#access_token=…` without starting query params with a `?`,
        // it can be necessary to redirect the request to `/#/?access_token=…`.
        // This prevents Angular routing from cropping the access token from the URL and use proper routing.
        // This could be removed once the GFBio SSO sends proper redirects.
        const location_path = this.location.path(true);
        if (location_path.startsWith('access_token=')) {
            this.location.go('/', location_path);
        }

        // Since `initialNavigation=false` in the app module, we have to start it here.
        this.router.initialNavigation();

        this.activatedRoute.queryParamMap.subscribe((params) => {
            if (params.has('access_token') && params.get('token_type') === 'Bearer' && params.has('expires_in')) {
                this.handleOpenIdConnectAccessToken(
                    params.get('access_token'),
                    parseInt(params.get('expires_in'), 10),
                    params.get('state'),
                );
            } else if (params.has('workflow')) {
                this.handleWorkflow(params.get('workflow'));
            } else if (params.has('gfbioBasketId')) {
                this.handleGFBioBasketId(params.get('gfbioBasketId'));
            } else if (params.keys.length) {
                // FALLBACK - must be last branch
                this.notificationService.error(`Unknown URL parameters »${params.keys.join(', ')}«`);
            }
        });
    }

    private handleOpenIdConnectAccessToken(accessToken: string, _expiresIn: number, state: string | null) {
        this.userService
            .oidcLogin(accessToken)
            .pipe(filter((success) => success))
            .subscribe(() => {
                if (state) {
                    state = decodeURIComponent(state);
                    this.router.navigateByUrl('?' + state);
                }
            });
    }

    private handleWorkflow(workflow: string) {
        try {
            const newLayer = Layer.fromDict(JSON.parse(workflow));
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
    }

    private handleGFBioBasketId(gfbioBasketIdString: string) {
        if (this.userService.isGuestUser()) {
            this.userService.redirectToOidcProvider(`gfbioBasketId=${gfbioBasketIdString}`);
        }

        try {
            const gfbioBasketId: number = JSON.parse(gfbioBasketIdString);
            this.projectService
                .getProjectStream()
                .pipe(first())
                .subscribe((project) => {
                    this.gfbioBasketIdToLayers(gfbioBasketId).subscribe(
                        (importResult: BasketAvailability) => {
                            // show popup
                            this.dialog.open(WorkflowParameterChoiceDialogComponent, {
                                data: {
                                    dialogTitle: 'GFBio Basket Import',
                                    sourceName: 'GFBio Basket',
                                    layers: importResult.availableLayers,
                                    nonAvailableNames: importResult.nonAvailableNames,
                                    numberOfLayersInProject: project.layers.length,
                                },
                            });
                        },
                        (error) => {
                            this.notificationService.error(`GFBio Basket Loading Error: »${error}«`);
                        },
                    );
                });
        } catch (error) {
            this.notificationService.error(`Invalid GFBio Basket Id: »${error}«`);
        }
    }

    private gfbioBasketIdToLayers(basketId: number): Observable<BasketAvailability> {
        const [availableEntries, nonAvailableEntries]: [Observable<BasketResult>, Observable<BasketResult>] = partition(
            this.mappingQueryService.getGFBioBasket(basketId).pipe(mergeMap((basket) => observableFrom(basket.results))),
            (basketResult: BasketResult) => basketResult.available,
        );

        const availableLayers: Observable<Array<VectorLayer<AbstractVectorSymbology>>> = availableEntries.pipe(
            mergeMap((basketResult) => this.gfbioBasketResultToLayer(basketResult)),
            toArray(),
        );

        const nonAvailableNames: Observable<Array<string>> = nonAvailableEntries.pipe(
            map((basketResult) => basketResult.title),
            toArray(),
        );

        return combineLatest([availableLayers, nonAvailableNames]).pipe(
            map(([layers, names]: [Array<VectorLayer<AbstractVectorSymbology>>, Array<string>]) => {
                return {
                    availableLayers: layers,
                    nonAvailableNames: names,
                } as BasketAvailability;
            }),
        );
    }

    private gfbioBasketResultToLayer(result: BasketResult): Observable<VectorLayer<AbstractVectorSymbology>> {
        let operator$: Observable<Operator>;
        if (result.type === 'abcd_grouped') {
            operator$ = this.userService
                .getSourceSchemaAbcd()
                .pipe(
                    map((sourceSchema) =>
                        GroupedAbcdBasketResultComponent.createOperatorFromGroupedABCDData(
                            result as IBasketGroupedAbcdResult,
                            sourceSchema,
                            true,
                        ),
                    ),
                );
        } else if (result.type === 'pangaea') {
            operator$ = observableOf(PangaeaBasketResultComponent.createOperatorFromPangaeaData(result as IBasketPangaeaResult));
        }

        return operator$.pipe(
            map((operator) => {
                let clustered = false;
                let symbology;

                switch (operator.resultType) {
                    case ResultTypes.POINTS:
                        symbology = PointSymbology.createClusterSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        clustered = true;
                        break;
                    case ResultTypes.POLYGONS:
                        symbology = VectorSymbology.createSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        break;
                    default:
                        throw new UnexpectedResultType();
                }

                return new VectorLayer({
                    name: result.title,
                    operator,
                    symbology,
                    clustered,
                });
            }),
        );
    }
}
