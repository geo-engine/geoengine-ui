import {ChangeDetectionStrategy, Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {RasterSymbology} from '../../layers/symbology/symbology.model';
import {Color} from '../color';
import {ColorAttributeInput} from '../color-attribute-input/color-attribute-input.component';
import {PaletteColorizer} from '../colorizer.model';

@Component({
    selector: 'geoengine-color-palette-editor',
    templateUrl: './color-palette-editor.component.html',
    styleUrls: ['./color-palette-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPaletteEditorComponent implements OnInit {
    @Input() symbology!: RasterSymbology;
    @Output() symbologyChanged: EventEmitter<RasterSymbology> = new EventEmitter();

    testColor?: ColorAttributeInput;
    allColors?: ColorAttributeInput[];

    colorMap = new Map<number, Color>();

    constructor() {}

    ngOnInit(): void {
        const newColor: ColorAttributeInput = {key: 'test', value: this.getPaletteColorizer().getColorAtIndex(0)};
        this.testColor = newColor;
        this.allColors = this.createColorAttributeInputs();
        console.log(this.colorMap);
    }

    debugClick(): void {
        console.log('Number:');

        console.log(this.getPaletteColorizer().getNumberOfColors());
        console.log('Individuals:');
        console.log(this.allColors);
    }

    getPaletteColorizer(): PaletteColorizer {
        return this.symbology.colorizer as PaletteColorizer;
    }

    createColorAttributeInputs(): ColorAttributeInput[] {
        let inputs: ColorAttributeInput[] = [];
        for (let i = 0; i < this.getPaletteColorizer().getNumberOfColors(); i++) {
            const newColor: ColorAttributeInput = {key: i.toString(), value: this.getPaletteColorizer().getColorAtIndex(i)};
            inputs.push(newColor); // array --> remove this, switch to iterating over map in HTML template (TODO)
            this.colorMap.set(i, newColor.value);
        }
        return inputs;
    }

    updateColor(pos: number, color: ColorAttributeInput): void {
        console.log('Changing pos' + pos + ' to:');
        console.log(color.value);
        this.colorMap.set(pos, color.value);
        const colors = this.colorMap;
        const colorizer = this.getPaletteColorizer().cloneWith({colors}); // must be named 'colors'?
        this.symbology = this.symbology.cloneWith({colorizer});

        // emit the change event to the parent component
        this.symbologyChanged.emit(this.symbology);
    }
}
