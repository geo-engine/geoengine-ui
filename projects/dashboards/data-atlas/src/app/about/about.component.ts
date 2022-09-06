import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'geoengine-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
}
