import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
    Layer,
    RasterLayer,
    RasterSymbology,
    SymbologyHistogramParams,
    SymbologyWorkflow,
    VectorLayer,
    VectorSymbology,
    extentToBboxDict,
} from '@geoengine/common';
import {BehaviorSubject, Subscription, combineLatest} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {MapService} from '../../../map/map.service';
import {UserService} from '../../../users/user.service';
import {SpatialResolution} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbologyEditorComponent implements OnInit, OnDestroy {
    @Input({required: true}) layer!: Layer;

    rasterSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<RasterSymbology> | undefined>(undefined);
    vectorSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<VectorSymbology> | undefined>(undefined);

    histogramParams$ = new BehaviorSubject<SymbologyHistogramParams | undefined>(undefined);

    histogramParamsSubscription?: Subscription = undefined;

    constructor(
        private readonly projectService: ProjectService,
        private readonly mapService: MapService,
        private readonly userService: UserService,
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

    changeRasterSymbology(rasterSymbology: RasterSymbology): void {
        this.projectService.changeLayer(this.layer, {symbology: rasterSymbology});
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
