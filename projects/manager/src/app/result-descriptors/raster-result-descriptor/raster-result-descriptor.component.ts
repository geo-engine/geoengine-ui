import {Component, input} from '@angular/core';
import {RasterBandDescriptor, TypedRasterResultDescriptor} from '@geoengine/openapi-client';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel, MatInput} from '@angular/material/input';
import {
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
} from '@angular/material/table';
import {MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {KeyValuePipe, NgForOf} from '@angular/common';

@Component({
    selector: 'geoengine-manager-raster-result-descriptor',
    templateUrl: './raster-result-descriptor.component.html',
    styleUrl: './raster-result-descriptor.component.scss',
    imports: [
        FormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        NgForOf,
        KeyValuePipe,
    ],
})
export class RasterResultDescriptorComponent {
    readonly resultDescriptor = input.required<TypedRasterResultDescriptor>();

    displayedColumns: string[] = ['index', 'name', 'measurement'];

    convertUnixToIso(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }

    get bandDataSource(): RasterBandDescriptor[] {
        return this.resultDescriptor().bands;
    }
}
