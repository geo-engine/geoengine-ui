import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-help-general-information',
    templateUrl: './help-general-information.component.html',
    styleUrls: ['./help-general-information.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpGeneralInformationComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
