import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';

@Component({
    selector: 'wave-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesSelectorComponent implements OnInit, OnDestroy {
    constructor() {}

    ngOnInit(): void {}

    ngOnDestroy(): void {}
}
