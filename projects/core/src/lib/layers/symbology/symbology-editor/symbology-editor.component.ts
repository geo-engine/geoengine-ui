import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
    Layer,
    RasterLayer,
    RasterSymbology,
    RasterSymbologyEditorComponent,
    SymbologyHistogramParams,
    SymbologyWorkflow,
    VectorLayer,
    VectorSymbology,
    extentToBboxDict,
} from '@geoengine/common';
import {BehaviorSubject, Subscription, combineLatest} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {MapService} from '../../../map/map.service';
import {SpatialResolution} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbologyEditorComponent implements OnInit, OnDestroy {
    @Input({required: true}) layer!: Layer;

    @ViewChild(RasterSymbologyEditorComponent) rasterSymbologyEditorComponent?: RasterSymbologyEditorComponent;

    rasterSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<RasterSymbology> | undefined>(undefined);
    vectorSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<VectorSymbology> | undefined>(undefined);

    histogramParams$ = new BehaviorSubject<SymbologyHistogramParams | undefined>(undefined);

    histogramParamsSubscription?: Subscription = undefined;

    unappliedRasterChanges = false;

    rasterSymbology?: RasterSymbology = undefined;

    constructor(
        private readonly projectService: ProjectService,
        private readonly mapService: MapService,
    ) {}

    ngOnInit(): void {
        this.setUp();
        this.createHistogramParamsSubscription();
    }

    ngOnDestroy(): void {
        if (this.histogramParamsSubscription) {
            this.histogramParamsSubscription.unsubscribe();
        }
    }

    applyRasterChanges(): void {
        if (!this.rasterSymbology) {
            return;
        }
        this.projectService.changeLayer(this.layer, {symbology: this.rasterSymbology});
        this.rasterSymbologyWorkflow$.next({workflowId: this.layer.workflowId, symbology: this.rasterSymbology});
        this.unappliedRasterChanges = false;
    }

    resetRasterChanges(): void {
        if (this.rasterSymbologyEditorComponent) {
            this.rasterSymbologyEditorComponent.resetChanges();
            this.unappliedRasterChanges = false;
        }
    }

    changeRasterSymbology(rasterSymbology: RasterSymbology): void {
        this.rasterSymbology = rasterSymbology;
        this.unappliedRasterChanges = true;
    }

    changeVectorSymbology(vectorSymbology: VectorSymbology): void {
        this.projectService.changeLayer(this.layer, {symbology: vectorSymbology});
    }

    private createHistogramParamsSubscription(): void {
        this.histogramParamsSubscription = combineLatest([
            this.projectService.getTimeStream(),
            this.mapService.getViewportSizeStream(),
            this.projectService.getSpatialReferenceStream(),
        ]).subscribe(([time, viewport, spatialReference]) => {
            this.histogramParams$.next({
                time,
                bbox: extentToBboxDict(viewport.extent),
                resolution: {x: viewport.resolution, y: viewport.resolution} as SpatialResolution,
                spatialReference,
            } as SymbologyHistogramParams);
        });
    }

    private setUp(): void {
        if (this.layer instanceof RasterLayer) {
            this.rasterSymbologyWorkflow$.next({
                symbology: this.layer.symbology,
                workflowId: this.layer.workflowId,
            });
        }

        if (this.layer instanceof VectorLayer) {
            this.vectorSymbologyWorkflow$.next({
                symbology: this.layer.symbology,
                workflowId: this.layer.workflowId,
            });
        }
    }
}
