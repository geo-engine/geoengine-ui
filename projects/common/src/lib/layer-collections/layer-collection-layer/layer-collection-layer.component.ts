import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    input,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
} from '@angular/core';
import {LayerListing as LayerCollectionLayerDict, ProviderLayerId as ProviderLayerIdDict} from '@geoengine/openapi-client';
import {LayersService} from '../layers.service';
import {VectorDataTypes} from '../../operators/datatype.model';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';

@Component({
    selector: 'geoengine-layer-collection-layer',
    templateUrl: './layer-collection-layer.component.html',
    styleUrls: ['./layer-collection-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class LayerCollectionLayerComponent implements OnChanges {
    @Input({required: false}) showLayerToggle = true;
    @Input() layer: LayerCollectionLayerDict | undefined = undefined;

    trackBy = input<any>(undefined);

    @Output() addClick: EventEmitter<ProviderLayerIdDict> = new EventEmitter();
    @Output() isExpanded: EventEmitter<boolean> = new EventEmitter();

    expanded = false;

    readonly VectorDataTypes = VectorDataTypes;

    protected layerMetadata: RasterLayerMetadata | VectorLayerMetadata | undefined = undefined;
    protected description: string = '';

    protected loading = false;

    constructor(
        private layerService: LayersService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            this.changeDetectorRef.markForCheck();
        }
    }

    async toggleExpand(): Promise<void> {
        if (this.layer) {
            this.expanded = !this.expanded;
            this.description = this.layer.description;
            if (!this.layerMetadata) {
                this.loading = true;
                const workflowId = await this.layerService.registerAndGetLayerWorkflowId(this.layer.id.providerId, this.layer.id.layerId);
                const resultDescriptor = await this.layerService.getWorkflowIdMetadata(workflowId);

                this.layerMetadata = resultDescriptor;
                this.loading = false;
                this.changeDetectorRef.markForCheck();
            } else {
                this.changeDetectorRef.markForCheck();
            }
        }

        this.isExpanded.emit(this.expanded);
    }

    onAdd(): void {
        if (this.layer) {
            this.addClick.emit(this.layer.id);
        }
    }
}
