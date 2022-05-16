import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Feature as OlFeature } from 'ol';
import OlPoint from 'ol/geom/Point';
import OlPolygon from 'ol/geom/Polygon';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'wave-full-display',
  templateUrl: './full-display.component.html',
  styleUrls: ['./full-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullDisplayComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { xStrings: string[], yStrings: string[] },
    private clipboard: Clipboard
  ) { }

  xCoords: string[] = [];
  yCoords: string[] = [];

  ngOnInit(): void {
    this.xCoords = this.data.xStrings;
    this.yCoords = this.data.yStrings;
  }

  copyToClipboard(): void {
    const xString: string = this.xCoords.toString();
    const yString: string = this.yCoords.toString();
    const toCopy: string = `X: ${xString}, Y: ${yString}`;
    const pending = this.clipboard.beginCopy(toCopy);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        pending.destroy();
      }
    };
    attempt();
  }
}
