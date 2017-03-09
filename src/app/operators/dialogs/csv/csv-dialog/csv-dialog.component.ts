import {Component, OnInit, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {Input} from '@angular/core/src/metadata/directives';

@Component({
    selector: 'wave-csv-dialog',
    templateUrl: './csv-dialog.component.html',
    styleUrls: ['./csv-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvDialogComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
    }

}
