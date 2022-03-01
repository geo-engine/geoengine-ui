import {Component, Inject, Input} from '@angular/core';
import {Basket, BasketEntry} from '../basket-model';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Plot} from '../../../../../wave-core-new/src/lib/plots/plot.model';

@Component({
    selector: 'gfbio-basket-dialog',
    templateUrl: './basket-dialog.component.html',
    styleUrls: ['./basket-dialog.component.scss'],
})

export class BasketDialogComponent {


    basket: Basket;

    constructor(
        private dialogRef: MatDialogRef<BasketDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {basket: Basket},
    ) {
        this.basket = config.basket;
    }
}
