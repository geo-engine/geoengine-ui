import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-dialog-help',
    templateUrl: './dialog-help.component.html',
    styleUrls: ['./dialog-help.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHelpComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
