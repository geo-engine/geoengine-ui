import {Component, ChangeDetectionStrategy, HostBinding} from '@angular/core';

@Component({
    selector: 'geoengine-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributionsComponent {
    @HostBinding('className') componentClass = 'mat-typography';
}
