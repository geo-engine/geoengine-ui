import {Component, Input} from '@angular/core';
import {Measurement, VectorColumnInfo, TypedVectorResultDescriptor} from '@geoengine/openapi-client';

interface Column {
    name: string;
    dataType: string;
    measurement: Measurement;
}

@Component({
    selector: 'geoengine-manager-vector-result-descriptor',
    templateUrl: './vector-result-descriptor.component.html',
    styleUrl: './vector-result-descriptor.component.scss',
    standalone: false,
})
export class VectorResultDescriptorComponent {
    @Input() resultDescriptor!: TypedVectorResultDescriptor;

    displayedColumns: string[] = ['name', 'dataType', 'measurement'];

    convertUnixToIso(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }

    get columnsDataSource(): Column[] {
        const keys = Object.keys(this.resultDescriptor.columns).sort();

        const columns: Column[] = [];

        for (const key of keys) {
            const column = this.resultDescriptor.columns[key] as VectorColumnInfo;

            columns.push({
                name: key,
                dataType: column.dataType,
                measurement: column.measurement,
            });
        }

        return columns;
    }
}
