import {Component, input, OnChanges} from '@angular/core';
import {Measurement, TypedVectorResultDescriptor, VectorColumnInfo} from '@geoengine/openapi-client';
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

interface Column {
    name: string;
    dataType: string;
    measurement: Measurement;
}

@Component({
    selector: 'geoengine-manager-vector-result-descriptor',
    templateUrl: './vector-result-descriptor.component.html',
    styleUrl: './vector-result-descriptor.component.scss',
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
    ],
})
export class VectorResultDescriptorComponent implements OnChanges {
    readonly resultDescriptor = input.required<TypedVectorResultDescriptor>();

    displayedColumns: string[] = ['name', 'dataType', 'measurement'];

    convertUnixToIso(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }

    columns: Column[] = [];

    ngOnChanges() {
        this.columns = this.columnsDataSource();
    }

    private columnsDataSource(): Column[] {
        const keys = Object.keys(this.resultDescriptor().columns).sort();

        const columns: Column[] = [];

        for (const key of keys) {
            const column = this.resultDescriptor().columns[key];

            columns.push({
                name: key,
                dataType: column.dataType,
                measurement: column.measurement,
            });
        }

        return columns;
    }
}
