import {Injectable} from '@angular/core';
// import * as chroma from 'chroma-js';
import {Color} from '../../colors/color';

@Injectable()
export class RandomColorService {
    static colorWheel: Array<[number, number, number]> =
        //        = chroma.cubehelix().lightness([0.3, 0.7]).scale().correctLightness().colors<'rgba'>(10, 'rgba');
        [
            [255, 0, 0], // '#FF0000', // red
            [0, 255, 0], // '#00FF00', // green
            [0, 0, 255], // '#0000FF', // blue
            [255, 255, 0], // '#FFFF00', // yellow
            [0, 255, 255], // '#00FFFF', // cyan
            [255, 0, 255], // '#FF00FF', // pink
            [255, 128, 0], // '#FF8000', // orange
            [255, 0, 128], // '#FF0080', // strong pink
            [128, 255, 0], // '#80FF00', // light green
            [0, 255, 128], // '#00FF80', // blue green
            [0, 128, 255], // '#0080FF', // light blue
            [128, 0, 255], // '#8000FF', // purple
        ];

    private colorIndex = 0;

    constructor() {
        // console.log('RandomColorService', RandomColorService.colorWheel);
    }

    getRandomColorRgba(alpha: number = 0.8): Color {
        let color = RandomColorService.colorWheel[this.colorIndex];
        this.colorIndex = (this.colorIndex + 1) % RandomColorService.colorWheel.length;
        return Color.fromRgbaLike([color[0], color[1], color[2], alpha]);
    }
}
