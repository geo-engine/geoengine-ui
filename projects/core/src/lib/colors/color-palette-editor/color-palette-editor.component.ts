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

    allColors?: ColorAttributeInput[];

    colorMap = new Map<number, Color>(); // HTML Template will use these to display the color cards

    constructor() {}

    ngOnInit(): void {
        this.allColors = this.createColorAttributeInputs();
    }

    /**
     * Used to initalize the color cards as well as update them when a linear or logarithmic gradient is applied
     */
    updateColorCards(): void {
        console.log('Updating colors cards...');
        this.allColors = this.createColorAttributeInputs();
    }

    setSymbology(newSymbology: RasterSymbology): void {
        this.symbology = newSymbology;
    }

    getColors(): Map<number, Color> {
        return this.colorMap;
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
    /*
    TODO (?):
    Get layerMaxValue and layerMinValue from parent component. The map indexes must be spread between min and max value.
    Perhaps it's possible to use the gradient breakpoints for this?
    */

    updateColor(pos: number, color: ColorAttributeInput): void {
        this.colorMap.set(pos, color.value);
        const colors = this.colorMap;
        const colorizer = this.getPaletteColorizer().cloneWith({colors}); // must be named 'colors' .. TODO: Get no data color and overflow data from parent and pass it along here
        this.symbology = this.symbology.cloneWith({colorizer});

        // emit the change event to the parent component
        this.symbologyChanged.emit(this.symbology);
    }
}
