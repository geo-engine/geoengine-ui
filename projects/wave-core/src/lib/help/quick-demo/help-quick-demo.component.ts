import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-quick-demo',
    templateUrl: './help-quick-demo.component.html',
    styleUrls: ['./help-quick-demo.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpQuickDemoComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
}
