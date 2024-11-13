import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    signal,
    viewChild,
    WritableSignal,
} from '@angular/core';
import {Breakpoints, BreakpointObserver} from '@angular/cdk/layout';
import {AsyncPipe} from '@angular/common';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {firstValueFrom} from 'rxjs';
import {
    BackendService,
    BBoxDict,
    CoreModule,
    DatasetService,
    LayoutService,
    MapContainerComponent,
    NotificationService,
    ProjectService,
    UserService,
    WfsParamsDict,
} from '@geoengine/core';
import {
    ColumnRangeFilterDict,
    PolygonSymbology,
    RasterVectorJoinDict,
    SourceOperatorDict,
    Time,
    VectorLayer,
    VectorSymbology,
} from '@geoengine/common';
import {utc} from 'moment';
import {DataSelectionService} from '../data-selection.service';
import {Workflow} from '@geoengine/openapi-client';
import {LegendComponent} from '../legend/legend.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';

interface SelectedProperty {
    featureId: number;
    bbox: BBoxDict;
}

@Component({
    selector: 'geoengine-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CoreModule, AsyncPipe, MatGridListModule, MatMenuModule, MatIconModule, MatButtonModule, MatCardModule, LegendComponent],
})
export class DashboardComponent implements AfterViewInit {
    readonly userService = inject(UserService);
    readonly dataSelectionService = inject(DataSelectionService);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly projectService = inject(ProjectService);
    private readonly notificationService = inject(NotificationService);
    private readonly datasetService = inject(DatasetService);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly backend = inject(BackendService);
    private readonly router = inject(Router);

    isSelectingBox = signal(false);
    selectedFeature: WritableSignal<SelectedProperty | undefined> = signal(undefined);
    isLandscape = signal(true);
    plotWidthPx = signal(100);
    plotHeightPx = signal(100);
    layersReverse = toSignal(this.dataSelectionService.layers);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    plotData = signal<any>(undefined);
    plotLoading = signal(false);

    mapComponent = viewChild.required(MapContainerComponent);

    analyzeCard = viewChild.required('analyzecard', {read: ElementRef});

    timeSteps: Time[] = [new Time(utc('2022-01-01')), new Time(utc('2023-01-01'))];

    async ngAfterViewInit(): Promise<void> {
        this.breakpointObserver.observe(Breakpoints.Web).subscribe((isLandscape) => {
            this.isLandscape.set(isLandscape.matches);
        });

        setTimeout(async () => {
            await this.loadProperties();

            this.projectService.getSelectedFeatureStream().subscribe(async (featureSelection) => {
                const features = await this.dataSelectionService.getPolygonLayerFeatures();
                if (featureSelection.feature) {
                    const actualFeature = features.find((f) => f.getId() === featureSelection.feature);
                    const props = actualFeature?.getProperties();
                    const id = props?.id;
                    const bbox = actualFeature?.getGeometry()?.getExtent();

                    if (!id || !bbox) {
                        // TODO: show error message

                        this.selectedFeature.set(undefined);
                        return;
                    }

                    this.selectedFeature.set({
                        featureId: id,
                        bbox: {
                            lowerLeftCoordinate: {x: bbox[0], y: bbox[1]},
                            upperRightCoordinate: {x: bbox[2], y: bbox[3]},
                        },
                    });
                } else {
                    this.selectedFeature.set(undefined);
                }
            });
        });
    }

    async loadProperties(): Promise<void> {
        const workflowId = await firstValueFrom(this.projectService.registerWorkflow(PROPERTIES_WORKFLOW));

        const polygonLayer = new VectorLayer({
            name: 'Bahn Properties',
            workflowId,
            isVisible: true,
            isLegendVisible: false,
            symbology: PROPERTIES_SYMBOLOGY,
        });

        return await firstValueFrom(this.dataSelectionService.setPolygonLayer(polygonLayer));
    }

    private computePlotSize(): void {
        const cardWidth = this.analyzeCard()?.nativeElement.clientWidth ?? 100;

        let plotWidth: number;

        if (this.isLandscape()) {
            plotWidth = cardWidth / 2 - 2 * LayoutService.remInPx;
        } else {
            plotWidth = cardWidth - 4 * LayoutService.remInPx;
            plotWidth = Math.min(plotWidth, window.innerWidth - 9 * LayoutService.remInPx);
        }

        const plotHeight = Math.min(plotWidth, window.innerHeight / 3);

        this.plotWidthPx.set(plotWidth);
        this.plotHeightPx.set(plotHeight);
    }

    async analyze(): Promise<void> {
        const feature = this.selectedFeature();
        if (!feature) {
            return;
        }

        const columnFilter: ColumnRangeFilterDict = {
            type: 'ColumnRangeFilter',
            params: {
                column: 'id',
                ranges: [[feature.featureId, feature.featureId]],
                keepNulls: false,
            },
            sources: {
                vector: PROPERTIES_SOURCE_OP,
            },
        };

        const rasterVectorJoin: RasterVectorJoinDict = {
            type: 'RasterVectorJoin',
            params: {
                names: {
                    type: 'names',
                    values: ['score'],
                },
                featureAggregation: 'mean',
                temporalAggregation: 'mean',
                featureAggregationIgnoreNoData: true,
                temporalAggregationIgnoreNoData: true,
            },
            sources: {
                vector: columnFilter,
                rasters: [
                    {
                        type: 'GdalSource',
                        params: {
                            data: 'ndvi',
                        },
                    },
                ],
            },
        };

        const workflow: Workflow = {
            type: 'Vector',
            operator: rasterVectorJoin,
        };

        const workflowId = await firstValueFrom(this.projectService.registerWorkflow(workflow));

        const time = await this.projectService.getTimeOnce();

        const wfsParams: WfsParamsDict = {
            workflowId,
            bbox: feature.bbox,
            time: {
                start: time.start.unix() * 1_000,
                end: time.end.unix() * 1_000,
            },
            queryResolution: CLASSIFICATION_RESOLUTION,
        };

        const sessionId = await firstValueFrom(this.userService.getSessionTokenForRequest());

        const wfsResponse = await firstValueFrom(this.backend.wfsGetFeature(wfsParams, sessionId));

        // console.log('wfs response', wfsResponse);

        // TODO: extract and display score
    }

    async reset(): Promise<void> {
        await firstValueFrom(this.dataSelectionService.clearPolygonLayer());
        this.changeDetectorRef.markForCheck();
    }

    logout(): void {
        this.userService.logout();
        this.router.navigate(['/signin']);
    }
}

const PROPERTIES_SOURCE_OP: SourceOperatorDict = {
    type: 'OgrSource',
    params: {data: '94ea7ae6-f464-454f-b0f9-ead706a2f093:bahn_properties'},
};

const PROPERTIES_WORKFLOW: Workflow = {
    type: 'Vector',
    operator: PROPERTIES_SOURCE_OP,
};

const PROPERTIES_SYMBOLOGY: VectorSymbology = PolygonSymbology.fromPolygonSymbologyDict({
    type: 'polygon',
    stroke: {
        width: {
            type: 'static',
            value: 2,
        },
        color: {
            type: 'static',
            color: [128, 0, 0, 255],
        },
    },
    fillColor: {
        type: 'static',
        color: [128, 0, 0, 128],
    },
    autoSimplified: true,
});

const CLASSIFICATION_RESOLUTION = 0.1;
