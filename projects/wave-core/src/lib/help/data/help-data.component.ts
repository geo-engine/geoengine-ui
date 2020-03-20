import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-data',
    templateUrl: './help-data.component.html',
    styleUrls: ['./help-data.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDataComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
