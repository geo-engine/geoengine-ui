import {Observable, BehaviorSubject} from 'rxjs';
import {map, tap, first} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener,
    Inject,
    OnInit,
    ViewChild, ViewContainerRef
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
    OperatorListComponent,
    TimeConfigComponent,
    HelpComponent,
    SourceOperatorListButton,
    OperatorListButtonGroups,
    SidenavConfig,
    StatisticsPlotComponent,
    HistogramOperatorComponent,
    StatisticsType,
    HistogramType
} from 'wave-core';

import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from './app-config.service';
import {DttLayoutService} from './layout.service';

import {SpectralOverviewPlotComponent} from './operators/dialogs/spectral-overview-plot/spectral-overview-plot.component';
import {SpectralOverviewPlotType} from './operators/types/spectral-overview-plot-type.model';
import {TwitterScreenshotShareComponent} from './twitter-screenshot-share/twitter-screenshot-share.component';
import {UseCaseListComponent} from './use-case/use-case-list/use-case-list.component';

@Component({
    selector: 'wave-dtt-root',
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

    readonly navigationButtons = AppComponent.setupNavigation();
    readonly addAFirstLayerConfig = AppComponent.setupAddDataConfig();

    middleContainerHeight$: Observable<number>;
    mapIsGrid$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(@Inject(Config) readonly config: AppConfig,
                @Inject(LayoutService) readonly layoutService: DttLayoutService,
                readonly layerService: LayerService,
                readonly projectService: ProjectService,
                readonly vcRef: ViewContainerRef, // reference used by color picker
                private userService: UserService,
                private storageService: StorageService,
                private changeDetectorRef: ChangeDetectorRef,
                private dialog: MatDialog,
                private iconRegistry: MatIconRegistry,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private activatedRoute: ActivatedRoute,
                private notificationService: NotificationService,
                private mapService: MapService,
                private sanitizer: DomSanitizer) {
        this.registerIcons();

        vcRef.length; // tslint:disable-line:no-unused-expression // just get rid of unused warning

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream().pipe(
            map(layers => layers.slice(0).reverse())
        );

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();
    }

    private registerIcons() {
        this.iconRegistry.addSvgIconInNamespace(
            'vat',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));

        // social media
        this.iconRegistry.addSvgIconInNamespace(
            'social-media',
            'twitter',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/Twitter_Logo_WhiteOnImage.svg'),
        );
    }

    ngOnInit() {
        this.mapService.registerMapComponent(this.mapComponent);
        this.mapIsGrid$ = this.mapService.isGrid$;

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(this.windowHeight$).pipe(
            tap(() => this.mapComponent.resize()),
        );
    }

    ngAfterViewInit() {
        this.layoutService.getSidenavContentComponentStream().subscribe(sidenavConfig => {
            this.rightSidenavContainer.load(sidenavConfig);
            if (sidenavConfig) {
                this.rightSidenav.open();
            } else {
                this.rightSidenav.close();
            }
        });
        this.projectService.getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        // handle query parameters directly if it is not embedded and using an auto login
        this.handleQueryParameters();

    }

    private static setupNavigation(): Array<NavigationButton> {
        return [
            {
                sidenavConfig: {component: UseCaseListComponent},
                icon: 'games',
                tooltip: 'Use Cases',
            },
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
            SourceOperatorListComponent.createDrawFeaturesButton(),
        ];
    }

    private static createOperatorListButtons(): OperatorListButtonGroups {
        return [
            {
                name: 'Plots', list: [
                    {
                        component: SpectralOverviewPlotComponent,
                        type: SpectralOverviewPlotType,
                        description: 'Create a spectral overview plot for multilayer sensor data',
                    },
                    {
                        component: HistogramOperatorComponent,
                        type: HistogramType,
                        description: 'Create a histogram from vector or raster data',
                    },
                    {
                        component: StatisticsPlotComponent,
                        type: StatisticsType,
                        description: 'Get statistics for any layer'
                    },
                ]
            },
            {name: 'Raster', list: OperatorListComponent.DEFAULT_RASTER_OPERATOR_DIALOGS},
        ];
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    private handleQueryParameters() {
        this.activatedRoute.queryParams.subscribe(p => {
            for (const parameter of Object.keys(p)) {
                const value = p[parameter];
                switch (parameter) {
                    case 'workflow':
                        try {
                            const newLayer = Layer.fromDict(JSON.parse(value));
                            this.projectService.getProjectStream().pipe(first()).subscribe(project => {
                                if (project.layers.length > 0) {
                                    // show popup
                                    this.dialog.open(WorkflowParameterChoiceDialogComponent, {
                                        data: {
                                            dialogTitle: 'Workflow URL Parameter',
                                            sourceName: 'URL parameter',
                                            layers: [newLayer],
                                            nonAvailableNames: [],
                                            numberOfLayersInProject: project.layers.length,
                                        }
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
                    default:
                        this.notificationService.error(`Unknown URL Parameter »${parameter}«`);
                }
            }
        });
    }

    twitter() {
        this.dialog.open(TwitterScreenshotShareComponent);
    }
}
