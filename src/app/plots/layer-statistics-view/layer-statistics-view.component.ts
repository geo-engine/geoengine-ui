import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';

interface LayerStatisticsData {
    rasters?: Array<NumericStatisticsData>;
    points?: Array<FeatureData>;
    lines?: Array<FeatureData>;
    polygons?: Array<FeatureData>;
}

interface FeatureData {
    [name: string]: NumericStatisticsData | TextualStatisticsData;
}

export interface NumericStatisticsData {
    count: number;
    nan_count: number;
    min: number;
    max: number;
    mean: number;
    stddev: number;
}

export interface TextualStatisticsData {
    count: number;
    distinct_values: number;
    value_counts: Array<[string, number]>;
}

@Component({
    selector: 'wave-layer-statistics-view',
    templateUrl: './layer-statistics-view.component.html',
    styleUrls: ['./layer-statistics-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerStatisticsViewComponent implements OnInit {

    @Input()
    public data: LayerStatisticsData;

    constructor() {
    }

    ngOnInit() {
    }

}
