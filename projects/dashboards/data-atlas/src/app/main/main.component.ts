import {Observable, BehaviorSubject, first, filter, map, forkJoin} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {
    LayoutService,
    ProjectService,
    MapService,
    MapContainerComponent,
    DatasetService,
    SidenavContainerComponent,
    LayerCollectionListingDict,
    SymbologyEditorComponent,
} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import moment from 'moment';
import {DataSelectionService} from '../data-selection.service';
import {AppDatasetService} from '../app-dataset.service';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';
import {Layer, LayersService, Time, UserService} from '@geoengine/common';

interface LayerCollectionBiListing {
    name: string;
    raster?: LayerCollectionListingDict;
    otherRaster?: LayerCollectionListingDict;
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
        @Inject(AppConfig) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly userService: UserService,
        readonly dataSelectionService: DataSelectionService,
        readonly _vcRef: ViewContainerRef, // reference used by color picker
        @Inject(DatasetService) readonly datasetService: AppDatasetService,
        private iconRegistry: MatIconRegistry,
        private mapService: MapService,
        private sanitizer: DomSanitizer,
        private readonly layersService: LayersService,
    ) {
        this.registerIcons();

        this.layersReverse$ = this.dataSelectionService.layers;

        forkJoin({
            raster4d: this.layersService.getLayerCollectionItems(this.config.DATA.RASTER4D.PROVIDER, this.config.DATA.RASTER4D.COLLECTION),
            rasterOther: this.layersService.getLayerCollectionItems(
                this.config.DATA.RASTER_OTHER.PROVIDER,
                this.config.DATA.RASTER_OTHER.COLLECTION,
            ),
            vector: this.layersService.getLayerCollectionItems(this.config.DATA.VECTOR.PROVIDER, this.config.DATA.VECTOR.COLLECTION),
        }).subscribe(({raster4d, rasterOther, vector}) => {
            const collections = new Map<string, LayerCollectionBiListing>();

            // create initial groups
            for (const item of raster4d.items) {
                if (item.type !== 'collection') {
                    continue;
                }

                collections.set(item.name, {
                    name: item.name,
                    raster: item as LayerCollectionListingDict,
                });
            }

            // add other raster layers to groups
            for (const item of rasterOther.items) {
                if (item.type !== 'collection') {
                    continue;
                }

                const collection = collections.get(item.name);

                if (collection && collection.raster) {
                    collection.otherRaster = item as LayerCollectionListingDict;
                } else {
                    collections.set(item.name, {
                        name: item.name,
                        otherRaster: item as LayerCollectionListingDict,
                    });
                }
            }

            // add vector layers to groups
            for (const item of vector.items) {
                if (item.type !== 'collection') {
                    continue;
                }

                const collection = collections.get(item.name);

                if (collection) {
                    collection.vector = item as LayerCollectionListingDict;
                } else {
                    collections.set(item.name, {
                        name: item.name,
                        vector: item as LayerCollectionListingDict,
                    });
                }
            }

            this.topLevelCollections$.next(Array.from(collections.values()).sort((a, b) => a.name.localeCompare(b.name)));
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
                    component: SymbologyEditorComponent,
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
