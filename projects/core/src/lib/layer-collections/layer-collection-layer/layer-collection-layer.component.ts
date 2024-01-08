import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {mergeMap} from 'rxjs';
import {LayerCollectionLayerDict, ProviderLayerIdDict} from '../../backend/backend.model';
import {Colorizer} from '../../colors/colorizer.model';
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

    readonly rasterColorizer = Colorizer.fromDict({
        type: 'linearGradient',
        breakpoints: [
            {value: 0, color: [122, 122, 122, 255]},
            {value: 1, color: [255, 255, 255, 255]},
        ],
        overColor: [255, 255, 255, 127],
        underColor: [122, 122, 122, 127],
        noDataColor: [0, 0, 0, 0],
    });

    protected layerMetadata: RasterLayerMetadata | VectorLayerMetadata | undefined = undefined;

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
            return 'undefined';
        }

        return this.layerMetadata.time.startStringOrNegInf();
    }

    get maxTimeString(): string | undefined {
        if (!this.layerMetadata) {
            return undefined;
        }

        if (!this.layerMetadata.time) {
            return 'undefined';
        }

        return this.layerMetadata.time.endStringOrPosInf();
    }

    get timeString(): string {
        if (!this.layerMetadata) {
            return 'undefined';
        }

        if (!this.layerMetadata.time) {
            return 'undefined';
        }

        const min = this.layerMetadata.time.startStringOrNegInf() || 'undefined';
        const max = this.layerMetadata.time.endStringOrPosInf() || 'undefined';

        return '[ ' + min + ' ,  ' + max + ' )';
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
