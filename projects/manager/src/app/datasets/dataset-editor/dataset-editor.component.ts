import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {
    RasterSymbology,
    Symbology,
    UUID,
    VectorSymbology,
    WHITE,
    WorkflowsService,
    createVectorSymbology as createDefaultVectorSymbology,
} from '@geoengine/common';
import {
    DatasetListing,
    RasterResultDescriptorWithType,
    TypedResultDescriptor,
    VectorResultDescriptorWithType,
} from '@geoengine/openapi-client';
import {DatasetsService} from '../../../../../common/src/lib/datasets/datasets.service';
import {BehaviorSubject} from 'rxjs';

export interface Dataset {
    layerType: FormControl<'plot' | 'raster' | 'vector'>;
    dataType: FormControl<string>;
    name: FormControl<string>;
    displayName: FormControl<string>;
    description: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-dataset-editor',
    templateUrl: './dataset-editor.component.html',
    styleUrl: './dataset-editor.component.scss',
})
export class DatasetEditorComponent implements OnInit, OnChanges {
    @Input({required: true}) dataset!: DatasetListing;

    form: FormGroup<Dataset> = this.placeholderForm();

    datasetWorkflowId$ = new BehaviorSubject<UUID | undefined>(undefined);

    rasterSymbology?: RasterSymbology = undefined;
    vectorSymbology?: VectorSymbology = undefined;

    constructor(
        private datasetsService: DatasetsService,
        private workflowsService: WorkflowsService,
    ) {}

    ngOnInit(): void {
        this.setUpForm();
        this.getWorkflowId().then((workflowId) => this.datasetWorkflowId$.next(workflowId));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.dataset) {
            this.setUpForm();

            this.setUpColorizer();
        }
    }

    createSymbology(): void {
        if (this.dataset.resultDescriptor.type === 'vector') {
            this.createVectorSymbology();
        }
        if (this.dataset.resultDescriptor.type === 'raster') {
            this.createRasterSymbology();
        }
    }

    private setUpColorizer(): void {
        if (this.dataset.symbology) {
            const symbology = Symbology.fromDict(this.dataset.symbology);

            if (symbology instanceof RasterSymbology) {
                this.rasterSymbology = symbology;
            } else {
                this.rasterSymbology = undefined;
            }

            if (symbology instanceof VectorSymbology) {
                this.vectorSymbology = symbology;
            } else {
                this.vectorSymbology = undefined;
            }
        } else {
            this.rasterSymbology = undefined;
            this.vectorSymbology = undefined;
        }
    }

    private getWorkflowId(): Promise<UUID> {
        if (this.dataset.resultDescriptor.type === 'raster') {
            return this.workflowsService.registerWorkflow({
                type: 'Raster',
                operator: {
                    type: 'GdalSource',
                    params: {
                        data: this.dataset.name,
                    },
                },
            });
        }

        if (this.dataset.resultDescriptor.type === 'vector') {
            return this.workflowsService.registerWorkflow({
                type: 'Vector',
                operator: {
                    type: 'OgrSource',
                    params: {
                        data: this.dataset.name,
                    },
                },
            });
        }

        throw new Error('Unknown dataset type');
    }

    private createVectorSymbology(): void {
        if (!(this.dataset.resultDescriptor.type === 'vector')) {
            return;
        }

        this.vectorSymbology = createDefaultVectorSymbology(this.dataset.resultDescriptor.dataType, WHITE);
    }

    private createRasterSymbology(): void {
        this.rasterSymbology = RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        });
    }

    private dataTypeFromResultDescriptor(rd: TypedResultDescriptor): string {
        if (rd.type === 'raster') {
            return (rd as RasterResultDescriptorWithType).dataType;
        }

        if (rd.type === 'vector') {
            return (rd as VectorResultDescriptorWithType).dataType;
        }

        // There are no plot datasets so this should never happen
        return '';
    }

    private setUpForm(): void {
        this.form = new FormGroup<Dataset>({
            layerType: new FormControl(this.dataset.resultDescriptor.type, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl(this.dataTypeFromResultDescriptor(this.dataset.resultDescriptor), {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl(this.dataset.name, {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl(this.dataset.displayName, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl(this.dataset.description, {
                nonNullable: true,
            }),
        });
    }

    private placeholderForm(): FormGroup<Dataset> {
        return new FormGroup<Dataset>({
            layerType: new FormControl('raster', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dataType: new FormControl('U8', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            name: new FormControl('name', {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
            }),
            displayName: new FormControl('displayName', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            description: new FormControl('description', {
                nonNullable: true,
            }),
        });
    }
}
