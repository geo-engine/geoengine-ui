import {ChangeDetectionStrategy, Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {RasterSymbology} from '../../layers/symbology/symbology.model';
import {Color} from '../color';
import {ColorAttributeInput} from '../color-attribute-input/color-attribute-input.component';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {PaletteColorizer} from '../colorizer.model';

@Component({
    selector: 'geoengine-color-palette-editor',
    templateUrl: './color-palette-editor.component.html',
    styleUrls: ['./color-palette-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPaletteEditorComponent implements OnInit {
    // Output and Input for communication with the parent "raster-symbology-editor" component
    @Input() symbology!: RasterSymbology;
    @Output() symbologyChanged: EventEmitter<RasterSymbology> = new EventEmitter();

    allColors: ColorAttributeInput[] = new Array<ColorAttributeInput>(); // HTML Template will use these to display the color cards

    colorWhite: Color = new Color({r: 255, g: 255, b: 255, a: 1}); //  {r: 255, g: 255, b: 255, a: 1}
    newTab: ColorAttributeInput = {key: '0', value: this.colorWhite};

    colorMap = new Map<number, Color>(); // Returned to the parent component as parameter for the colorizer

    constructor() {}

    ngOnInit(): void {
        // this.allColors = this.createColorAttributeInputs();
        for (let i = 0; i < this.getPaletteColorizer().getNumberOfColors(); i++) {
            this.colorMap.set(i, this.getPaletteColorizer().getColorAtIndex(i));
        }
        console.log(this.colorMap);

        // Fill allColors List with ColorAttributeInputs based on breakpoints
        for (let bp of this.getPaletteColorizer().getBreakpoints()) {
            const newInput = {key: bp.value.toString(), value: bp.color};
            this.allColors.push(newInput);
        }
    }

    /**
     * Used to initalize the color cards as well as update them when a linear or logarithmic gradient is applied
     */
    updateColorCards(): void {
        console.log('Updating colors cards...');
        // this.allColors = this.createColorAttributeInputs();
    }

    setSymbology(newSymbology: RasterSymbology): void {
        this.symbology = newSymbology;
    }

    getColors(): Map<number, Color> {
        return this.colorMap;
    }

    debugClick(): void {
        // console.log('Number:');
        // console.log(this.getPaletteColorizer().getNumberOfColors());
        // console.log('Individuals:');
        // console.log(this.allColors);
        console.log(this.allColors);
    }

    getPaletteColorizer(): PaletteColorizer {
        return this.symbology.colorizer as PaletteColorizer;
    }

    // createInputsFromMap(): ColorAttributeInput[] {
    //     let newInputs: ColorAttributeInput[] = [];
    //     this.colorMap.forEach((v: Color, k: number) => {
    //         const newColor: ColorAttributeInput = {key: k.toString(), value: v};
    //         newInputs.push(newColor);
    //     });
    //     return newInputs;
    // }

    createColorAttributeInputs(): ColorAttributeInput[] {
        let inputs: ColorAttributeInput[] = [];
        for (let i = 0; i < this.getPaletteColorizer().getNumberOfColors(); i++) {
            const newColor: ColorAttributeInput = {key: i.toString(), value: this.getPaletteColorizer().getColorAtIndex(i)};
            inputs.push(newColor); // array --> remove this, switch to iterating over map in HTML template (TODO)
            this.colorMap.set(i, newColor.value);
        }
        return inputs;
    }

    /**
     * Creates a single ColorAttributeInput for display in the HTML template.
     * @param color The color for the tab
     * @param index The value in the raster layer that the color is meant to represent
     */
    // colorAttributeInputFromColorMapEntry(color: Color, index: Number): ColorAttributeInput {
    //     // console.log('Creating at index ' + index + ':');
    //     // console.log(color);
    //     const attributeInput: ColorAttributeInput = {key: index.toString(), value: color};
    //     // return attributeInput;
    //     return this.anAttributeInput!; // works...
    // }

    /*
    TODO (?):
    Get layerMaxValue and layerMinValue from parent component. The map indexes must be spread between min and max value.
    Perhaps it's possible to use the gradient breakpoints for this?
    */

    updateColor(pos: number, color: ColorAttributeInput): void {
        this.allColors[pos] = color;
        const colorKey: string = color.key;
        const colorValue: Color = color.value;
        this.colorMap.set(parseInt(color.key), color.value); // Sets the key/value in the map according to the ColorAttributeInput. Old map value still exists after this!

        // this.rebuildColorMap();

        // Create a new symbology to emit
        const colorizer = this.getPaletteColorizer().cloneWith({colors: this.colorMap}); // TODO: Get no data color and overflow data from parent and pass it along here
        this.symbology = this.symbology.cloneWith({colorizer});

        // emit the change event to the parent component
        this.symbologyChanged.emit(this.symbology);
        console.log(this.allColors);
    }

    /**
     * Recreate the color map so that only values for which a ColorAttributeInput exists
     * are contained within the map. This is necessary because the $event that gets
     * passed to updateColor won't contain the old rasterValue to delete in manually at
     * the time of updating.
     */
    rebuildColorMap(pos: number, color: ColorAttributeInput): void {
        this.allColors[pos] = color; // because else, changes to HTML won't affect allColors

        // Recreate the map
        this.colorMap = new Map<number, Color>();
        this.allColors.forEach((input: ColorAttributeInput) => {
            const colorKey: number = parseInt(input.key);
            const colorValue: Color = input.value;
            this.colorMap.set(colorKey, colorValue);
        });
        this.emitSymbology();
    }

    /**
     * Sort allColors by raster layer values, so ColorAttributeInputs are displayed in the correct order.
     * Only called by parent when apply is pressed, so Inputs don't jump around while user is editing.
     */
    sortColorAttributeInputs(): void {
        this.allColors.sort((a: ColorAttributeInput, b: ColorAttributeInput) => {
            return Math.sign(parseInt(a.key) - parseInt(b.key));
        });
    }

    // Commented out for now (DEBUGGING)

    addColorTab(): void {
        console.log(this.newTab);

        this.emitSymbology();
    }

    removeColorTab(index: number): void {
        const rasterValue: number = parseInt(this.allColors[index].key);
        // this.allColors.
        this.colorMap.delete(rasterValue);

        this.allColors.splice(index, 1);

        this.emitSymbology();
    }

    emitSymbology() {
        // Create a new symbology to emit
        const colorizer = this.getPaletteColorizer().cloneWith({colors: this.colorMap}); // TODO: Get no data color and overflow data from parent and pass it along here
        this.symbology = this.symbology.cloneWith({colorizer});

        // emit the change event to the parent component
        this.symbologyChanged.emit(this.symbology);
    }
}
