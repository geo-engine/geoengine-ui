import {Observable, BehaviorSubject, mergeMap, ReplaySubject} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
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
    WorkflowDict,
    BackendService,
    RasterSymbology,
    Colorizer,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import {SelectLayersComponent} from '../select-layers/select-layers.component';
import {ComponentPortal} from '@angular/cdk/portal';
import moment from 'moment';
import {DataSelectionService} from '../data-selection.service';
import {AppDatasetService} from '../app-dataset.service';
import {
    TerraNovaGroup,
    EbvHierarchy,
    EbvTreeSubgroup,
    EbvTreeEntity,
    EbvDatasetId,
    guessDataRange,
    computeTimeSteps,
} from '../select-layers/available-layers';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'wave-app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly analysisVisible$ = new BehaviorSubject(false);
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    readonly layerGroups: ReplaySubject<Map<TerraNovaGroup, Array<EbvHierarchy>>> = new ReplaySubject(1);

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
    ) {
        this.registerIcons();

        this.layersReverse$ = this.dataSelectionService.layers;

        this.http.get<Array<[TerraNovaGroup, Array<EbvHierarchy>]>>('assets/datasets.json').subscribe((datasets) => {
            const datasetMap = new Map<TerraNovaGroup, Array<EbvHierarchy>>(datasets);

            for (const ebvHierarchies of datasetMap.values()) {
                for (const ebvHierarchy of ebvHierarchies) {
                    ebvHierarchy.tree.entities.sort((a, b) => a.name.localeCompare(b.name));
                }
            }

            this.layerGroups.next(datasetMap);
        });
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);
    }

    ngAfterViewInit(): void {
        this.reset();
        this.mapComponent.resize();
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    showAnalysis(): void {
        this.analysisVisible$.next(true);
    }

    loadData(layer: EbvHierarchy, subgroup: EbvTreeSubgroup, entity: EbvTreeEntity): void {
        const datasetId: EbvDatasetId = {
            fileName: layer.tree.fileName,
            groupNames: [subgroup.name],
            entity: entity.id,
        };

        const workflow: WorkflowDict = {
            type: 'Raster',
            operator: {
                type: 'GdalSource',
                params: {
                    dataset: {
                        type: 'external',
                        providerId: layer.providerId,
                        datasetId: JSON.stringify(datasetId),
                    },
                },
            },
        };

        const symbology = new RasterSymbology(1.0, Colorizer.fromDict(layer.tree.colorizer));

        this.userService
            .getSessionTokenForRequest()
            .pipe(
                mergeMap((sessionToken) => this.backend.registerWorkflow(workflow, sessionToken)),
                mergeMap(({id: workflowId}) => {
                    const rasterLayer = new RasterLayer({
                        workflowId,
                        name: entity.name,
                        symbology,
                        isLegendVisible: false,
                        isVisible: true,
                    });

                    return this.dataSelectionService.setRasterLayer(
                        rasterLayer,
                        computeTimeSteps(layer.tree.time, layer.tree.timeStep),
                        guessDataRange(symbology.colorizer),
                    );
                }),
            )
            .subscribe();
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
