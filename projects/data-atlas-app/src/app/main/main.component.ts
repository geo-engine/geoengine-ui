import {Observable, BehaviorSubject, mergeMap, ReplaySubject, first, filter, map, combineLatest, of} from 'rxjs';
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
import {MatIconRegistry} from '@angular/material/icon';
import {
    Layer,
    LayoutService,
    UserService,
    RandomColorService,
    NotificationService,
    Config,
    ProjectService,
    MapService,
    MapContainerComponent,
    Time,
    SpatialReferenceService,
    DatasetService,
    RasterLayer,
    BackendService,
    RasterSymbology,
    RasterSymbologyEditorComponent,
    SidenavContainerComponent,
    LayerCollectionDict,
    LayerCollectionService,
    ProviderLayerIdDict,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import {SelectLayersComponent} from '../select-layers/select-layers.component';
import {ComponentPortal} from '@angular/cdk/portal';
import moment from 'moment';
import {DataRange, DataSelectionService} from '../data-selection.service';
import {AppDatasetService} from '../app-dataset.service';
import {TerraNovaGroup, EbvHierarchy} from '../select-layers/available-layers';
import {HttpClient} from '@angular/common/http';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';

@Component({
    selector: 'wave-app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    @ViewChild(MatSidenav, {static: true}) leftSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) leftSidenavContainer!: SidenavContainerComponent;

    readonly topLevelCollections$ = new BehaviorSubject<Array<LayerCollectionDict>>([]);

    readonly selectedLayers$ = new BehaviorSubject<Array<ProviderLayerIdDict | undefined>>([]);

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly analysisVisible$ = new BehaviorSubject(false);
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    readonly layerGroups: ReplaySubject<Map<TerraNovaGroup, Array<EbvHierarchy>>> = new ReplaySubject(1);

    readonly isSymbologyButtonVisible: Observable<boolean> = this.dataSelectionService.rasterLayer.pipe(
        map((rasterLayer) => !!rasterLayer),
    );

    datasetPortal = new ComponentPortal(SelectLayersComponent);

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly userService: UserService,
        readonly dataSelectionService: DataSelectionService,
        readonly _vcRef: ViewContainerRef, // reference used by color picker
        @Inject(DatasetService) readonly datasetService: AppDatasetService,
        private _userService: UserService,
        private iconRegistry: MatIconRegistry,
        private _randomColorService: RandomColorService,
        private _notificationService: NotificationService,
        private mapService: MapService,
        private _spatialReferenceService: SpatialReferenceService,
        private sanitizer: DomSanitizer,
        private readonly backend: BackendService,
        private readonly http: HttpClient,
        private readonly layerCollectionService: LayerCollectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.registerIcons();

        this.layersReverse$ = this.dataSelectionService.layers;

        this.layerCollectionService
            .getLayerCollectionItems('1690c483-b17f-4d98-95c8-00a64849cd0b', '{"Path":{"path":"."}}')
            .subscribe((items) => {
                const collections = [];
                for (const item of items) {
                    if (item.type === 'collection') {
                        collections.push(item as LayerCollectionDict);
                    }
                }
                this.selectedLayers$.next(new Array(collections.length).fill(false));
                this.topLevelCollections$.next(collections);
            });
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);

        this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.leftSidenavContainer.load(sidenavConfig);

            let openClosePromise: Promise<MatDrawerToggleResult>;
            if (sidenavConfig) {
                openClosePromise = this.leftSidenav.open();
            } else {
                openClosePromise = this.leftSidenav.close();
            }

            openClosePromise.then(() => this.mapComponent.resize());
        });
    }

    ngAfterViewInit(): void {
        this.reset();
        this.mapComponent.resize();
    }

    icon(name: string): string {
        if (name === 'Anthropogenic activity') {
            return 'terrain';
        } else if (name === 'Biodiversity') {
            return 'pets';
        } else if (name === 'Climate') {
            return 'public';
        } else {
            return 'class';
        }
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    layerSelected(i: number, id: ProviderLayerIdDict | undefined): void {
        const selected = this.selectedLayers$.getValue();
        selected[i] = id;
        this.selectedLayers$.next(selected);
    }

    showAnalysis(): void {
        this.analysisVisible$.next(true);
    }

    editSymbology(): void {
        this.dataSelectionService.rasterLayer
            .pipe(
                first(),
                filter((rasterLayer) => !!rasterLayer),
            )
            .subscribe((rasterLayer) => {
                this.layoutService.setSidenavContentComponent({
                    component: RasterSymbologyEditorComponent,
                    keepParent: false,
                    config: {
                        layer: rasterLayer,
                    },
                });
            });
    }

    loadData(i: number): void {
        const id = this.selectedLayers$.getValue()[i];
        if (!id) {
            return;
        }

        this.layerCollectionService
            .getLayer(id.providerId, id.layerId)
            .pipe(
                mergeMap((layer) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]) => {
                    if (!layer.symbology) {
                        throw new Error('Layer has no symbology');
                    }

                    if (!layer.properties) {
                        throw new Error('Layer has no properties');
                    }

                    if (!('timeSteps' in layer.properties)) {
                        throw new Error('Layer has no timeSteps');
                    }

                    if (!('dataRange' in layer.properties)) {
                        throw new Error('Layer has no dataRange');
                    }

                    const timeSteps: Array<Time> = JSON.parse(layer.properties['timeSteps']).map((t: number) => new Time(t));

                    const range: [number, number] = JSON.parse(layer.properties['dataRange']);
                    const dataRange: DataRange = {
                        min: range[0],
                        max: range[1],
                    };

                    const rasterLayer = new RasterLayer({
                        name: 'EBV',
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology: RasterSymbology.fromDict(layer.symbology) as RasterSymbology,
                    });

                    return this.dataSelectionService.setRasterLayer(rasterLayer, timeSteps, dataRange);
                }),
            )
            .subscribe(() => this.changeDetectorRef.markForCheck());
    }

    private reset(): void {
        this.projectService.clearLayers();
        this.projectService.clearPlots();
        this.projectService.setTime(new Time(moment.utc()));
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/geoengine-white.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    @HostListener('window:resize')
    private windowHeight(): void {
        this.windowHeight$.next(window.innerHeight);
    }
}
