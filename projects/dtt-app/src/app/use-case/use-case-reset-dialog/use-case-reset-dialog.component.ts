import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-dtt-use-case-reset-dialog',
    templateUrl: './use-case-reset-dialog.component.html',
    styleUrls: ['./use-case-reset-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCaseResetDialogComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
