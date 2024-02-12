import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {RasterSymbology, Symbology, SymbologyWorkflow, WorkflowsService} from '@geoengine/common';
import {
    DatasetListing,
    RasterResultDescriptorWithType,
    TypedResultDescriptor,
    VectorResultDescriptorWithType,
} from '@geoengine/openapi-client';
import {DatasetsService} from '../datasets.service';
import {BehaviorSubject} from 'rxjs';
import {Raster} from 'ol/source';

interface Dataset {
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

    symbologyWorkflow$ = new BehaviorSubject<SymbologyWorkflow<RasterSymbology> | undefined>(undefined);

    constructor(
        private datasetsService: DatasetsService,
        private workflowsService: WorkflowsService,
    ) {}

    ngOnInit(): void {
        this.setUpForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.dataset) {
            this.dataset = changes.dataset.currentValue;
            this.setUpForm();
        }
    }

    changeRasterSymbology(_symbology: RasterSymbology): void {
        // TODO: update via API
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

        this.datasetsService.getDataset(this.dataset.name).then((dataset) => {
            if (!dataset.symbology) {
                return;
            }

            const symbology = Symbology.fromDict(dataset.symbology);

            if (!(symbology instanceof RasterSymbology)) {
                return;
            }

            this.workflowsService
                .registerWorkflow({
                    type: 'Raster',
                    operator: {
                        type: 'GdalSource',
                        params: {
                            data: dataset.name,
                        },
                    },
                })
                .then((workflowId) => {
                    this.symbologyWorkflow$.next({
                        symbology,
                        workflowId,
                    });
                });
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
