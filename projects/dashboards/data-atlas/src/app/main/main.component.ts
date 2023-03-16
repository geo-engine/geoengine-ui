import {Observable, BehaviorSubject, first, filter, map, combineLatest} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {
    Layer,
    LayoutService,
    UserService,
    Config,
    ProjectService,
    MapService,
    MapContainerComponent,
    Time,
    DatasetService,
    RasterSymbologyEditorComponent,
    SidenavContainerComponent,
    LayerCollectionService,
    LayerCollectionListingDict,
} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import moment from 'moment';
import {DataSelectionService} from '../data-selection.service';
import {AppDatasetService} from '../app-dataset.service';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';

interface LayerCollectionBiListing {
    name: string;
    raster?: LayerCollectionListingDict;
    vector?: LayerCollectionListingDict;
}

@Component({
    selector: 'geoengine-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    @ViewChild(MatSidenav, {static: true}) leftSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) leftSidenavContainer!: SidenavContainerComponent;

    readonly topLevelCollections$ = new BehaviorSubject<Array<LayerCollectionBiListing>>([]);

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly analysisVisible$ = new BehaviorSubject(false);
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    readonly isSymbologyButtonVisible: Observable<boolean> = this.dataSelectionService.rasterLayer.pipe(
        map((rasterLayer) => !!rasterLayer),
    );

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly userService: UserService,
        readonly dataSelectionService: DataSelectionService,
        readonly _vcRef: ViewContainerRef, // reference used by color picker
        @Inject(DatasetService) readonly datasetService: AppDatasetService,
        private iconRegistry: MatIconRegistry,
        private mapService: MapService,
        private sanitizer: DomSanitizer,
        private readonly layerCollectionService: LayerCollectionService,
    ) {
        this.registerIcons();

        this.layersReverse$ = this.dataSelectionService.layers;

        combineLatest([
            this.layerCollectionService.getLayerCollectionItems(this.config.DATA.RASTER.PROVIDER, this.config.DATA.RASTER.COLLECTION),
            this.layerCollectionService.getLayerCollectionItems(this.config.DATA.VECTOR.PROVIDER, this.config.DATA.VECTOR.COLLECTION),
        ]).subscribe(([raster, vector]) => {
            const collections: Array<LayerCollectionBiListing> = [];

            // create initial groups
            for (const item of raster.items) {
                if (item.type !== 'collection') {
                    continue;
                }
                collections.push({
                    name: item.name,
                    raster: item as LayerCollectionListingDict,
                });
            }

            // add vector layers to groups
            for (const item of vector.items) {
                if (item.type !== 'collection') {
                    continue;
                }

                const collection = collections.find((c) => c.name === item.name);

                if (!collection) {
                    continue; // could not find matching name
                }

                collection.vector = item as LayerCollectionListingDict;
            }

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
