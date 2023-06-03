import {Component, ChangeDetectionStrategy, HostBinding} from '@angular/core';

@Component({
    selector: 'geoengine-ebv-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributionsComponent {
    @HostBinding('className') componentClass = 'mat-typography';
}
