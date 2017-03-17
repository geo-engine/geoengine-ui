import {Injectable} from '@angular/core';

@Injectable()
export class RandomColorService {
    private static colorWheel: Array<[number, number, number]> = [
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
    private colorIndex: number = 0;

    constructor() {}

    getRandomColor(): [number, number, number, number] {
        let color = RandomColorService.colorWheel[this.colorIndex];
        this.colorIndex = (this.colorIndex + 1) % RandomColorService.colorWheel.length;
        return [color[0], color[1], color[2], 0.8];
    }

    getRandomColorWithAlpha(alpha: number): [number, number, number, number] {
        let color = this.getRandomColor();
        color[3] = alpha;
        return color;
    }
}
