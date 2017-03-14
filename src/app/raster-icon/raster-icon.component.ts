import {Component, OnInit, ChangeDetectionStrategy, Input, AfterViewInit} from '@angular/core';
import {MappingColorizer, MappingColorizerRasterSymbology} from '../../symbology/symbology.model';
import {Layer} from '../../layers/layer.model';

@Component({
  selector: 'wave-raster-icon',
  templateUrl: './raster-icon.component.html',
  styleUrls: ['./raster-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterIconComponent implements AfterViewInit {

  @Input() xCells: number;
  @Input() yCells: number;
  @Input() colorizer: MappingColorizer;

  xCellStarts: Array<number> = [];
  yCellStarts: Array<number> = [];
  colorMapping: Array<number>;
  colors = ['#bfbfbf', '#7f7f7f'];

  constructor() {}

  cellColor(x: number, y: number): string {
      const idx = this.xCells*y + x;
      const mapIdx = this.colorMapping[idx];
      const clr = this.colors[mapIdx];
      console.log("RasterIconComponent", idx, mapIdx, clr);
      return clr;
  }

  ngOnInit() {
      this.xCellStarts = Array.from({length: this.xCells},(v,k)=>k);
      this.yCellStarts = Array.from({length: this.yCells},(v,k)=>k);
      this.updateColorMapping(this.colors.length);
  }

    updateColorMapping(nclr: number) {
      if ( !this.colorMapping || nclr !== this.colors.length ) {
          const ncells = this.xCells * this.yCells;
          const scale = ( ncells < nclr) ? nclr / ncells : 1;
          this.colorMapping = Array.from({length: ncells}, (v, k) => (k % nclr));
          console.log("RasterIconComponent", nclr, nclr, ncells, scale, this.colorMapping);
      }
  }

  ngAfterViewInit() {
      const validSymbology = this.colorizer && this.colorizer.breakpoints && this.colorizer.breakpoints.length > 0;
      if (validSymbology) {
          this.updateColorMapping(this.colorizer.breakpoints.length);
          this.colors = this.colorizer.breakpoints.map(b => b[1]);
      }
      console.log("RasterIconComponent", validSymbology, this.xCellStarts, this.yCellStarts, this.colorMapping, this.colors);
  }

}
