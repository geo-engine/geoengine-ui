import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'geoengine-confirmation-dialog',
    templateUrl: './confirmation.component.html',
    styleUrl: './confirmation.component.css',
})
export class ConfirmationComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmationComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: {message: string},
    ) {}
}
