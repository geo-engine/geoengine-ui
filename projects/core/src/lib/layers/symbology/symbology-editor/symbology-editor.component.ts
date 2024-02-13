import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Layer, RasterLayer, RasterSymbology, SymbologyWorkflow, VectorLayer, VectorSymbology} from '@geoengine/common';
import {BehaviorSubject} from 'rxjs';
import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'geoengine-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbologyEditorComponent implements OnInit {
    @Input({required: true}) layer!: Layer;

    rasterSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<RasterSymbology> | undefined>(undefined);
    vectorSymbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<VectorSymbology> | undefined>(undefined);

    constructor(private projectService: ProjectService) {}

    ngOnInit(): void {
        this.setUp();
    }

    changeRasterSymbology(rasterSymbology: RasterSymbology): void {
        this.projectService.changeLayer(this.layer, {symbology: rasterSymbology});
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
