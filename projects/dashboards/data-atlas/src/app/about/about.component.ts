import {Component, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'geoengine-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AboutComponent {}
