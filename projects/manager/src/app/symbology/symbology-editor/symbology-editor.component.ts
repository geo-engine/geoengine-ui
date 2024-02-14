import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatasetsService, RasterSymbology, Symbology, SymbologyWorkflow, UUID, VectorSymbology, WorkflowsService} from '@geoengine/common';
import {Dataset} from '@geoengine/openapi-client';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'geoengine-manager-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
})
export class SymbologyEditorComponent implements OnChanges {
    @Input({required: true}) workflowId!: UUID;
    @Input() rasterSymbology: RasterSymbology | undefined;
    @Input() vectorSymbology: VectorSymbology | undefined;

    rasterSymbologyWorkflow?: SymbologyWorkflow<RasterSymbology> = undefined;
    vectorSymbologyWorkflow?: SymbologyWorkflow<VectorSymbology> = undefined;

    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly workflowsService: WorkflowsService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.workflowId || changes.rasterSymbology || changes.vectorSymbology) {
            this.setUp();
        }
    }
    setUp(): void {
        if (this.rasterSymbology) {
            this.rasterSymbologyWorkflow = {symbology: this.rasterSymbology, workflowId: this.workflowId};
        } else {
            this.rasterSymbologyWorkflow = undefined;
        }

        if (this.vectorSymbology) {
            this.vectorSymbologyWorkflow = {symbology: this.vectorSymbology, workflowId: this.workflowId};
        } else {
            this.vectorSymbologyWorkflow = undefined;
        }
    }

    changeRasterSymbology(_symbology: RasterSymbology): void {
        // TODO: update via API
    }

    changeVectorSymbology(_symbology: VectorSymbology): void {
        // TODO: update via API
    }
}
