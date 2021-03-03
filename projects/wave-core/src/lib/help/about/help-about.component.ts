import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-about',
    templateUrl: './help-about.component.html',
    styleUrls: ['./help-about.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpAboutComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
}
