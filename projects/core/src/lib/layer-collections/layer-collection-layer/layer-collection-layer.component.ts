import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
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
export class LayerCollectionLayerComponent implements OnInit, OnChanges {
    @Input() layer: LayerCollectionLayerDict | undefined = undefined;
    @Output() addClick: EventEmitter<ProviderLayerIdDict> = new EventEmitter();
    @Output() isExpanded: EventEmitter<boolean> = new EventEmitter();

    expanded = false;

    readonly VectorDataTypes = VectorDataTypes;

    protected layerMetadata: RasterLayerMetadata | VectorLayerMetadata | undefined = undefined;

    protected loading = false;

    constructor(private layerService: LayerCollectionService, private changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            this.changeDetectorRef.markForCheck();
        }
    }

    ngOnInit(): void {}

    toggleExpand(): void {
        if (this.layer) {
            this.expanded = !this.expanded;
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

    get rasterLayerMetadata(): RasterLayerMetadata | undefined {
        if (this.layerMetadata && this.layerMetadata.layerType === 'raster') {
            return this.layerMetadata as RasterLayerMetadata;
        }
        return undefined;
    }

    get vectorLayerMetadata(): VectorLayerMetadata | undefined {
        if (this.layerMetadata && this.layerMetadata.layerType === 'vector') {
            return this.layerMetadata as VectorLayerMetadata;
        }
        return undefined;
    }

    get minTimeString(): string | undefined {
        if (!this.layerMetadata) {
            return undefined;
        }

        if (!this.layerMetadata.time) {
            return undefined;
        }

        return this.layerMetadata.time.startStringOrNegInf();
    }

    get maxTimeString(): string | undefined {
        if (!this.layerMetadata) {
            return undefined;
        }

        if (!this.layerMetadata.time) {
            return undefined;
        }

        return this.layerMetadata.time.endStringOrPosInf();
    }

    get bboxLowerLeftString(): string | undefined {
        if (this.layerMetadata && this.layerMetadata.bbox) {
            return `Min: ${this.layerMetadata.bbox.xmin} : ${this.layerMetadata.bbox.ymin}`;
        }
        return undefined;
    }

    get bboxUpperRightString(): string | undefined {
        if (this.layerMetadata && this.layerMetadata.bbox) {
            return `Max: ${this.layerMetadata.bbox.xmax} : ${this.layerMetadata.bbox.ymax}`;
        }
        return undefined;
    }
}
