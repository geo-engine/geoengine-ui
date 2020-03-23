import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-export',
    templateUrl: './help-export.component.html',
    styleUrls: ['./help-export.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpExportComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
