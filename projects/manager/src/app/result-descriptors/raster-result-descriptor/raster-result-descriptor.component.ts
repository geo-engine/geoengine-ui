import {Component, Input} from '@angular/core';
import {RasterBandDescriptor, TypedRasterResultDescriptor} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-manager-raster-result-descriptor',
    templateUrl: './raster-result-descriptor.component.html',
    styleUrl: './raster-result-descriptor.component.scss',
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
}
