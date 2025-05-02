import {Component, Input} from '@angular/core';
import {BoundingBox2D, GeoTransform, GridBoundingBox2D} from '@geoengine/common';
import {RasterBandDescriptor, TypedRasterResultDescriptor} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-manager-raster-result-descriptor',
    templateUrl: './raster-result-descriptor.component.html',
    styleUrl: './raster-result-descriptor.component.scss',
    standalone: false,
})
export class RasterResultDescriptorComponent {
    @Input() resultDescriptor!: TypedRasterResultDescriptor;

    displayedColumns: string[] = ['index', 'name', 'measurement'];

    convertUnixToIso(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }

    get bandDataSource(): RasterBandDescriptor[] {
        return this.resultDescriptor.bands;
    }

    get boundingBox(): BoundingBox2D {
        const gt = GeoTransform.fromGdalDatasetGeoTransform(this.resultDescriptor.spatialGrid.spatialGrid.geoTransform);
        const pxBounds = GridBoundingBox2D.fromDict(this.resultDescriptor.spatialGrid.spatialGrid.gridBounds);
        return gt.gridBoundsToSpatialBounds(pxBounds);
    }

    get spatialResolution(): SpatialResolution {
        return {
            x: this.resultDescriptor.spatialGrid.spatialGrid.geoTransform.xPixelSize,
            y: this.resultDescriptor.spatialGrid.spatialGrid.geoTransform.yPixelSize,
        };
    }
}

interface SpatialResolution {
    x: number;
    y: number;
}
