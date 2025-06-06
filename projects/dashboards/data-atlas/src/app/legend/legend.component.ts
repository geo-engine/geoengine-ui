import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {RasterLayer, VectorLayer} from '@geoengine/common';

@Component({
    selector: 'geoengine-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class LegendComponent implements OnChanges {
    @Input() layer?: VectorLayer | RasterLayer = undefined;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {}

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
