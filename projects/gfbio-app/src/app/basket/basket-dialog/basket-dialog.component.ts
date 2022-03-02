import {Component, Inject} from '@angular/core';
import {Basket} from '../basket-model';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'wave-gfbio-basket-dialog',
    templateUrl: './basket-dialog.component.html',
    styleUrls: ['./basket-dialog.component.scss'],
})
export class BasketDialogComponent {
    basket: Basket;

    constructor(private dialogRef: MatDialogRef<BasketDialogComponent>, @Inject(MAT_DIALOG_DATA) private config: {basket: Basket}) {
        this.basket = config.basket;
    }
}
