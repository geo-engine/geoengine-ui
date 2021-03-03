import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

@Component({
    selector: 'wave-help',
    templateUrl: 'help.html',
    styleUrls: ['./help.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent implements OnInit {
    ngOnInit() {}
}
