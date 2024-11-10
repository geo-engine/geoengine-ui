import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input} from '@angular/core';
import {LayerMetadata, RasterLayerMetadata, VectorLayerMetadata} from '../../layers/layer-metadata.model';
import {VectorDataTypes} from '../../operators/datatype.model';
import {Colorizer} from '../../colors/colorizer.model';

@Component({
    selector: 'geoengine-layer-collection-layer-details',
    templateUrl: './layer-collection-layer-details.component.html',
    styleUrls: ['./layer-collection-layer-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionLayerDetailsComponent {
    @Input() description: string | undefined;
    @Input() layerMetadata: LayerMetadata | undefined = undefined;

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

    constructor() {}

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
