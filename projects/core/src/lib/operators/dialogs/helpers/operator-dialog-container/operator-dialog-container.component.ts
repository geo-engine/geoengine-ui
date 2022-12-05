import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'geoengine-operator-dialog-container',
    templateUrl: './operator-dialog-container.component.html',
    styleUrls: ['./operator-dialog-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorDialogContainerComponent implements OnInit {
    @Input() loading?: boolean = false;

    constructor() {}

    ngOnInit(): void {}
}
