import {Component, OnInit, ChangeDetectionStrategy, HostBinding} from '@angular/core';

@Component({
    selector: 'wave-dtt-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {

    @HostBinding('class') class = 'mat-typography';

    constructor() {
    }

    ngOnInit(): void {
    }

}
