import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef, input, signal} from '@angular/core';
import {RasterLayer} from '@geoengine/common';
import {CoreModule, RasterLegendComponent} from '@geoengine/core';

@Component({
    selector: 'geoengine-legend', // eslint-disable-line @angular-eslint/component-selector
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CoreModule, RasterLegendComponent],
})
export class LegendComponent {
    layer = input<RasterLayer>();

    visible = signal(true);
}
