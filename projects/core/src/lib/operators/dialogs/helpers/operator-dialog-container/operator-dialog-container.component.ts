import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
    selector: 'geoengine-operator-dialog-container',
    templateUrl: './operator-dialog-container.component.html',
    styleUrls: ['./operator-dialog-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class OperatorDialogContainerComponent {
    @Input() loading? = false;
}
