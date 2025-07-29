import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {RasterLayer, FxLayoutDirective, FxLayoutAlignDirective, FxLayoutGapDirective} from '@geoengine/common';
import {RasterLegendComponent} from '@geoengine/core';

@Component({
    selector: 'geoengine-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FxLayoutDirective, FxLayoutAlignDirective, FxLayoutGapDirective, RasterLegendComponent],
})
export class LegendComponent implements OnChanges {
    @Input() layer?: RasterLayer = undefined;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(_changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }
}
