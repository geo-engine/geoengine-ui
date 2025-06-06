import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {RasterLayer} from '@geoengine/common';

@Component({
    selector: 'geoengine-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class LegendComponent implements OnChanges {
    @Input() layer?: RasterLayer = undefined;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(_changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }
}
