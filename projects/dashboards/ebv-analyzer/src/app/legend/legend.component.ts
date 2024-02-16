import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {RasterLayer} from '@geoengine/common';

@Component({
    selector: 'geoengine-legend', // eslint-disable-line @angular-eslint/component-selector
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent implements OnChanges {
    @Input() layer?: RasterLayer = undefined;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(_changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }
}
