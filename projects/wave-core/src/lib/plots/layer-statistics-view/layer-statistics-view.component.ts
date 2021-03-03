import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {NumericStatisticsData} from './layer-statistics-numeric-details/layer-statistics-numeric-details.component';
import {TextualStatisticsData} from './layer-statistics-textual-details/layer-statistics-textual-details.component';

interface LayerStatisticsData {
    rasters?: Array<NumericStatisticsData>;
    points?: Array<FeatureData>;
    lines?: Array<FeatureData>;
    polygons?: Array<FeatureData>;
}

interface FeatureData {
    [name: string]: NumericStatisticsData | TextualStatisticsData;
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

    constructor() {}

    ngOnInit() {}
}
