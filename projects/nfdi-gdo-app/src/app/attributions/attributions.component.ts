import {Component, OnInit, ChangeDetectionStrategy, HostBinding} from '@angular/core';

@Component({
    selector: 'wave-app-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributionsComponent implements OnInit {
    @HostBinding('className') componentClass = 'mat-typography';

    constructor() {}

    ngOnInit(): void {}
}
