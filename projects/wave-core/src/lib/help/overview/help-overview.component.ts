import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-overview',
    templateUrl: './help-overview.component.html',
    styleUrls: ['./help-overview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpOverviewComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
}
