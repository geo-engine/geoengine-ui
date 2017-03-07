import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'wave-csv-dialog',
  templateUrl: './csv-dialog.component.html',
  styleUrls: ['./csv-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvDialogComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
