import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {
    DatasetsService,
    RasterSymbology,
    RasterSymbologyEditorComponent,
    SymbologyWorkflow,
    UUID,
    VectorSymbology,
    VectorSymbologyEditorComponent,
    WorkflowsService,
} from '@geoengine/common';

@Component({
    selector: 'geoengine-manager-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
})
export class SymbologyEditorComponent implements OnChanges {
    @Input({required: true}) workflowId!: UUID;
    @Input() rasterSymbology: RasterSymbology | undefined;
    @Input() vectorSymbology: VectorSymbology | undefined;

    @ViewChild(RasterSymbologyEditorComponent) rasterSymbologyEditorComponent?: RasterSymbologyEditorComponent;
    @ViewChild(VectorSymbologyEditorComponent) vectorSymbologyEditorComponent?: VectorSymbologyEditorComponent;

    rasterSymbologyWorkflow?: SymbologyWorkflow<RasterSymbology> = undefined;
    vectorSymbologyWorkflow?: SymbologyWorkflow<VectorSymbology> = undefined;

    unappliedChanges = false;

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
        this.unappliedChanges = false;
    }

    applyChanges(): void {
        if (this.rasterSymbology) {
            this.updateRasterSymbology();
        }

        if (this.vectorSymbology) {
            this.updateVectorSymbology();
        }

        this.unappliedChanges = false;
    }

    resetChanges(): void {
        if (this.rasterSymbologyEditorComponent) {
            this.rasterSymbologyEditorComponent.resetChanges();
            this.unappliedChanges = false;
        }
    }

    changeRasterSymbology(symbology: RasterSymbology): void {
        this.rasterSymbology = symbology;
        this.unappliedChanges = true;
    }

    changeVectorSymbology(symbology: VectorSymbology): void {
        this.vectorSymbology = symbology;
        this.unappliedChanges = true;
    }

    updateRasterSymbology(): void {
        // TODO: update via API
    }

    updateVectorSymbology(): void {
        // TODO: update via API
    }
}
