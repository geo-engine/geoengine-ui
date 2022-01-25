import {Component, OnInit, ChangeDetectionStrategy, HostBinding} from '@angular/core';

@Component({
    selector: 'wave-ebv-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributionsComponent implements OnInit {
    @HostBinding('className') componentClass = 'mat-typography';

    constructor() {}

    ngOnInit(): void {}
}
