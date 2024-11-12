import {Component, ChangeDetectionStrategy, input, signal} from '@angular/core';
import {RasterLayer} from '@geoengine/common';
import {CoreModule} from '@geoengine/core';

@Component({
    selector: 'geoengine-legend', // eslint-disable-line @angular-eslint/component-selector
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CoreModule],
})
export class LegendComponent {
    layer = input<RasterLayer>();

    visible = signal(true);
}
