import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {NumericStatisticsData} from '../layer-statistics-view.component';

@Component({
    selector: 'wave-layer-statistics-numeric-details',
    templateUrl: './layer-statistics-numeric-details.component.html',
    styleUrls: ['./layer-statistics-numeric-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerStatisticsNumericDetailsComponent implements OnInit {

    @Input()
    data: NumericStatisticsData;

    constructor() {
    }

    ngOnInit() {
    }

}
