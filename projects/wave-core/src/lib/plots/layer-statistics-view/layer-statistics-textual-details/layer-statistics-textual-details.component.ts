import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';

export interface TextualStatisticsData {
    count: number;
    distinct_values: number;
    value_counts: Array<[string, number]>;
}

@Component({
    selector: 'wave-layer-statistics-textual-details',
    templateUrl: './layer-statistics-textual-details.component.html',
    styleUrls: ['./layer-statistics-textual-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerStatisticsTextualDetailsComponent implements OnInit {
    @Input()
    data: TextualStatisticsData;

    constructor() {}

    ngOnInit() {}
}
