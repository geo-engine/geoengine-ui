import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChange} from '@angular/core';
import {IColorizerData} from '../colors/colorizer-data.model';
import {Color} from '../colors/color';

@Component({
    selector: 'wave-raster-icon',
    templateUrl: './raster-icon.component.html',
    styleUrls: ['./raster-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterIconComponent implements OnInit, OnChanges {

    @Input() xCells: number;
    @Input() yCells: number;
    @Input() colorizer: IColorizerData;

    xCellStarts: Array<number> = [];
    yCellStarts: Array<number> = [];
    colorMapping: Array<number>;
    colors: Array<string>;
    grays = ['rgba(191,191,191,1)', 'rgba(127,127,127,1)'];

    constructor() {
    }

    cellColor(x: number, y: number): string {
        const idx = this.xCells * y + x;
        const mapIdx = this.colorMapping[idx];
        return this.colors[mapIdx];
    }

    ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
        this.updateColorMapping();
        // console.log("RasterIconComponent.ngOnChanges", this);
    }

    ngOnInit() {
        this.xCellStarts = Array.from({length: this.xCells}, (v, k) => k);
        this.yCellStarts = Array.from({length: this.yCells}, (v, k) => k);
        this.updateColorMapping();
        // console.log("RasterIconComponent.ngOnInit", this);
    }

    updateColorMapping() {
        let colors = this.grays;
        let gradient = true;

        const validSymbology = this.colorizer && this.colorizer.breakpoints && this.colorizer.breakpoints.length > 0;
        if (validSymbology) {
            colors = this.colorizer.breakpoints.map(br => Color.rgbaToCssString(br.rgba));
            gradient = this.colorizer.type === 'gradient' || this.colorizer.type === 'logarithmic';
        }

        const numberOfColors = colors.length;

        if (!this.colorMapping || colors !== this.colors) {
            const numberOfCells = this.xCells * this.yCells;
            let colorMapping = new Array(numberOfCells);

            const scale = gradient ? numberOfColors / (this.xCells + this.yCells - 1) : numberOfColors / numberOfCells;

            for (let y = 0; y < this.yCells; y++) {
                for (let x = 0; x < this.xCells; x++) {
                    const idx = y * this.xCells + x;
                    if (numberOfColors === 2) {
                        colorMapping[idx] = (y % 2 === 0) ? (x % 2) : ((x + 1) % 2);
                    } else {
                        const uidx = gradient ? this.xCells - 1 - x + y : idx;
                        colorMapping[idx] = Math.trunc(uidx * scale) % numberOfColors;
                    }
                }
            }
            this.colorMapping = colorMapping;
            this.colors = colors;
        }
    }
}
