import {Component, Input, OnChanges, SimpleChanges, ViewChild, inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    DatasetsService,
    RasterSymbology,
    RasterSymbologyEditorComponent,
    SymbologyWorkflow,
    UUID,
    VectorSymbology,
    VectorSymbologyEditorComponent,
    CommonModule,
} from '@geoengine/common';
import {ResponseError} from '@geoengine/openapi-client';
import {AppConfig} from '../../app-config.service';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'geoengine-manager-symbology-editor',
    templateUrl: './symbology-editor.component.html',
    styleUrl: './symbology-editor.component.scss',
    imports: [CommonModule, MatButton],
})
export class SymbologyEditorComponent implements OnChanges {
    private readonly datasetsService = inject(DatasetsService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly config = inject(AppConfig);

    @Input({required: true}) workflowId!: UUID;
    @Input() datasetName: string | undefined;
    @Input() rasterSymbology: RasterSymbology | undefined;
    @Input() vectorSymbology: VectorSymbology | undefined;

    @ViewChild(RasterSymbologyEditorComponent) rasterSymbologyEditorComponent?: RasterSymbologyEditorComponent;
    @ViewChild(VectorSymbologyEditorComponent) vectorSymbologyEditorComponent?: VectorSymbologyEditorComponent;

    rasterSymbologyWorkflow?: SymbologyWorkflow<RasterSymbology> = undefined;
    vectorSymbologyWorkflow?: SymbologyWorkflow<VectorSymbology> = undefined;

    unappliedChanges = false;

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

    async updateRasterSymbology(): Promise<void> {
        if (this.datasetName && this.rasterSymbology) {
            try {
                await this.datasetsService.updateSymbology(this.datasetName, this.rasterSymbology.toDict());

                this.rasterSymbologyWorkflow = {symbology: this.rasterSymbology, workflowId: this.workflowId};

                this.unappliedChanges = false;
                this.snackBar.open('Symbology successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            } catch (error) {
                const e = error as ResponseError;
                const errorJson = await e.response.json().catch(() => ({}));
                const errorMessage = errorJson.message ?? 'Updating symbology failed.';
                this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
            }
        }
    }

    async updateVectorSymbology(): Promise<void> {
        if (this.datasetName && this.vectorSymbology) {
            try {
                await this.datasetsService.updateSymbology(this.datasetName, this.vectorSymbology.toDict());

                this.vectorSymbologyWorkflow = {symbology: this.vectorSymbology, workflowId: this.workflowId};

                this.unappliedChanges = false;
                this.snackBar.open('Symbology successfully updated.', 'Close', {duration: this.config.DEFAULTS.SNACKBAR_DURATION});
            } catch (error) {
                const e = error as ResponseError;
                const errorJson = await e.response.json().catch(() => ({}));
                const errorMessage = errorJson.message ?? 'Updating symbology failed.';
                this.snackBar.open(errorMessage, 'Close', {panelClass: ['error-snackbar']});
            }
        }
    }
}
