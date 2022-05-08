import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Feature as OlFeature } from 'ol';
import OlPoint from 'ol/geom/Point';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'wave-full-display',
  templateUrl: './full-display.component.html',
  styleUrls: ['./full-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullDisplayComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { coordDisplay: OlFeature, type: string },
    private clipboard: Clipboard
  ) { }

  xCoords: string[] = [];
  yCoords: string[] = [];

  ngOnInit(): void {
    this.readCoordinates(this.data.coordDisplay);
  }

  readCoordinates(geometry: OlFeature): void {
    const p: OlPoint = <OlPoint>geometry.getGeometry();
    if (this.data.type == 'points') {
      this.xCoords = p.getCoordinates()[0].toString().split(',');
      this.yCoords = p.getCoordinates()[1].toString().split(',');
      console.log("Lengths: " + this.xCoords.length + ', ' + this.yCoords.length);
    } else if (this.data.type == 'polygons') {
      const l = p.getCoordinates().length;
      let allCoords: string[] = [];
      for (let i = 0; i < l; i++) {
        const coord = p.getCoordinates()[i].toString().split(',');
        allCoords = allCoords.concat(coord);
      }
      for (let i = 0; i < allCoords.length - 1; i += 2) {
        this.xCoords.push(allCoords[i]);
        this.yCoords.push(allCoords[i + 1]);
      }
    }
  }

  copyToClipboard(): void {
    const p: OlPoint = <OlPoint>this.data.coordDisplay.getGeometry();
    const xCoords: string = p.getCoordinates()[0].toString();
    const yCoords: string = p.getCoordinates()[1].toString();
    const toCopy: string = `X: ${xCoords}, Y: ${yCoords}`;
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
