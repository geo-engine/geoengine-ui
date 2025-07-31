import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    input,
    OnChanges,
    Output,
    SimpleChanges,
    inject,
} from '@angular/core';
import {LayerListing as LayerCollectionLayerDict, ProviderLayerId as ProviderLayerIdDict} from '@geoengine/openapi-client';
import {LayersService} from '../layers.service';
import {VectorDataTypes} from '../../operators/datatype.model';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {LayerCollectionLayerDetailsComponent} from '../layer-collection-layer-details/layer-collection-layer-details.component';

@Component({
    selector: 'geoengine-layer-collection-layer',
    templateUrl: './layer-collection-layer.component.html',
    styleUrls: ['./layer-collection-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon, MatIconButton, MatProgressBar, LayerCollectionLayerDetailsComponent],
})
export class LayerCollectionLayerComponent implements OnChanges {
    private layerService = inject(LayersService);
    private changeDetectorRef = inject(ChangeDetectorRef);

    readonly showLayerToggle = input(true);
    readonly layer = input<LayerCollectionLayerDict>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trackBy = input<any>(undefined);

    @Output() addClick = new EventEmitter<ProviderLayerIdDict>();
    @Output() isExpanded = new EventEmitter<boolean>();

    expanded = false;

    readonly VectorDataTypes = VectorDataTypes;

    protected layerMetadata: RasterLayerMetadata | VectorLayerMetadata | undefined = undefined;
    protected description: string = '';

    protected loading = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            this.changeDetectorRef.markForCheck();
        }
    }

    async toggleExpand(): Promise<void> {
        const layer = this.layer();
        if (layer) {
            this.expanded = !this.expanded;
            this.description = layer.description;
            if (!this.layerMetadata) {
                this.loading = true;
                const workflowId = await this.layerService.registerAndGetLayerWorkflowId(layer.id.providerId, layer.id.layerId);
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
        const layer = this.layer();
        if (layer) {
            this.addClick.emit(layer.id);
        }
    }
}
