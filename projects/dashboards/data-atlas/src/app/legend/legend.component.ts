import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef, inject} from '@angular/core';
import {RasterLayer, VectorLayer, FxLayoutDirective, FxLayoutAlignDirective, FxLayoutGapDirective} from '@geoengine/common';
import {RasterLegendComponent, CoreModule} from '@geoengine/core';

@Component({
    selector: 'geoengine-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FxLayoutDirective, FxLayoutAlignDirective, FxLayoutGapDirective, RasterLegendComponent, CoreModule],
})
export class LegendComponent implements OnChanges {
    readonly changeDetectorRef = inject(ChangeDetectorRef);

    @Input() layer?: VectorLayer | RasterLayer = undefined;

    ngOnChanges(_changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }

    get asRasterLayer(): RasterLayer | undefined {
        return this.layer instanceof RasterLayer ? this.layer : undefined;
    }

    get asVectorLayer(): VectorLayer | undefined {
        return this.layer instanceof VectorLayer ? this.layer : undefined;
    }
}
