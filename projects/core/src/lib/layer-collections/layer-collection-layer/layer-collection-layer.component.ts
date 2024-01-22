import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {mergeMap} from 'rxjs';
import {LayerCollectionLayerDict, ProviderLayerIdDict} from '../../backend/backend.model';
import {RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {VectorDataTypes} from '../../operators/datatype.model';
import {LayerCollectionService} from '../layer-collection.service';

@Component({
    selector: 'geoengine-layer-collection-layer',
    templateUrl: './layer-collection-layer.component.html',
    styleUrls: ['./layer-collection-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionLayerComponent implements OnChanges {
    @Input() layer: LayerCollectionLayerDict | undefined = undefined;
    @Output() addClick: EventEmitter<ProviderLayerIdDict> = new EventEmitter();
    @Output() isExpanded: EventEmitter<boolean> = new EventEmitter();

    expanded = false;

    readonly VectorDataTypes = VectorDataTypes;

    protected layerMetadata: RasterLayerMetadata | VectorLayerMetadata | undefined = undefined;
    protected description: string = '';

    protected loading = false;

    constructor(
        private layerService: LayerCollectionService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            this.changeDetectorRef.markForCheck();
        }
    }

    toggleExpand(): void {
        if (this.layer) {
            this.expanded = !this.expanded;
            this.description = this.layer.description;
            if (!this.layerMetadata) {
                this.loading = true;
                this.layerService
                    .registerAndGetLayerWorkflowId(this.layer.id.providerId, this.layer.id.layerId)
                    .pipe(mergeMap((workflowId) => this.layerService.getWorkflowIdMetadata(workflowId)))
                    .subscribe((resultDescriptor) => {
                        this.layerMetadata = resultDescriptor;
                        this.loading = false;
                        this.changeDetectorRef.markForCheck();
                    });
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
