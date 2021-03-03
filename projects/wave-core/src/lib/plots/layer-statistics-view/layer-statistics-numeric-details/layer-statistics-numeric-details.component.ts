import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';

export interface NumericStatisticsData {
    count: number;
    nan_count: number;
    min: number;
    max: number;
    mean: number;
    stddev: number;
}

@Component({
    selector: 'wave-layer-statistics-numeric-details',
    templateUrl: './layer-statistics-numeric-details.component.html',
    styleUrls: ['./layer-statistics-numeric-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerStatisticsNumericDetailsComponent implements OnInit {
    @Input()
    data: NumericStatisticsData;

    constructor() {}

    ngOnInit() {}
}
