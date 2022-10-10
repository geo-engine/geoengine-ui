import {Observable, BehaviorSubject} from 'rxjs';
import {first, map, tap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Inject,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';
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
    LayerCollectionService,
} from '@geoengine/core';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from '../app-config.service';
import {ReplaySubject} from 'rxjs';

@Component({
    selector: 'geoengine-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;
    @ViewChild(MatTabGroup, {static: true}) bottomTabs!: MatTabGroup;

    @ViewChild(MatSidenav, {static: true}) rightSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer!: SidenavContainerComponent;

    @ViewChild('topToolbar', {static: true, read: ElementRef}) topToolbar!: ElementRef;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly layerListVisible$: Observable<boolean>;
    readonly layerDetailViewVisible$: Observable<boolean>;

    readonly addDataConfig = new ReplaySubject<SidenavConfig>(1);
    readonly navigationButtons = new ReplaySubject<Array<NavigationButton>>(1);
    readonly AddDataComponent = AddDataComponent;

    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;
    mapIsGrid$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly vcRef: ViewContainerRef, // reference used by color picker, MUST BE EXACTLY THIS NAME
        readonly userService: UserService,
        private readonly layerService: LayerCollectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly randomColorService: RandomColorService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly notificationService: NotificationService,
        private readonly mapService: MapService,
        private readonly spatialReferenceService: SpatialReferenceService,
    ) {
        vcRef.length; // eslint-disable-line @typescript-eslint/no-unused-expressions

        this.layersReverse$ = this.projectService.getLayerStream().pipe(map((layers) => layers.slice(0).reverse()));

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();

        this.mapIsGrid$ = this.mapService.isGrid$;

        const totalHeight$ = this.windowHeight$.pipe(map((height) => height - this.topToolbar.nativeElement.offsetHeight));

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(totalHeight$).pipe(tap(() => this.mapComponent.resize()));
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(totalHeight$);

        this.setupAddDataConfig().subscribe((addDataConfig) => this.addDataConfig.next(addDataConfig));
        this.setupNavigation().subscribe((navigationButtons) => this.navigationButtons.next(navigationButtons));
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);

        // TODO: remove if table is back
        this.layoutService.setLayerDetailViewVisibility(false);
    }

    ngAfterViewInit(): void {
        this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.rightSidenavContainer.load(sidenavConfig);

            let openClosePromise: Promise<MatDrawerToggleResult>;
            if (sidenavConfig) {
                openClosePromise = this.rightSidenav.open();
            } else {
                openClosePromise = this.rightSidenav.close();
            }

            openClosePromise.then(() => this.mapComponent.resize());
        });
        this.projectService
            .getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        // emit window height once to resize components if necessary
        this.windowHeight();

        // set the stored tab index
        // this.layoutService.getLayerDetailViewTabIndexStream().subscribe(tabIndex => {
        //     if (this.bottomTabs.selectedIndex !== tabIndex) {
        //         this.bottomTabs.selectedIndex = tabIndex;
        //         setTimeout(() => this.changeDetectorRef.markForCheck());
        //     }
        // });

        this.handleQueryParameters();
    }

    setTabIndex(index: number): void {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    private setupNavigation(): Observable<Array<NavigationButton>> {
        return this.addDataConfig.pipe(
            map((addDataConfig) => [
                NavigationComponent.createLoginButton(this.userService, this.layoutService, this.config),
                {
                    sidenavConfig: addDataConfig,
                    icon: 'add',
                    tooltip: 'Add Data',
                },
                {
                    sidenavConfig: {component: OperatorListComponent, config: {operators: MainComponent.createOperatorListButtons()}},
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
                // {
                //     sidenavConfig: {component: HelpComponent},
                //     icon: 'help',
                //     tooltip: 'Help',
                // },
            ]),
        );
    }

    private setupAddDataConfig(): Observable<SidenavConfig> {
        return this.createAddDataListButtons().pipe(map((buttons) => ({component: AddDataComponent, config: {buttons}})));
    }

    private createAddDataListButtons(): Observable<Array<AddDataButton>> {
        return AddDataComponent.createLayerRootCollectionButtons(this.layerService).pipe(
            map((buttons) => [
                ...buttons,
                AddDataComponent.createUploadButton(),
                AddDataComponent.createDrawFeaturesButton(),
                AddDataComponent.createAddWorkflowByIdButton(),
            ]),
        );
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

    private handleQueryParameters(): void {
        const params = new URLSearchParams(window.location.search);
        const sessionState = params.get('session_state');
        const code = params.get('code');
        const state = params.get('state');

        if (sessionState && code && state) {
            this.userService.oidcLogin({sessionState, code, state}).pipe(first()).subscribe();
        }
    }
}
