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

    colorMap = new Map<number, Color>(); // Returned to the parent component as parameter for the colorizer

    constructor() {}

    ngOnInit(): void {
        for (let i = 0; i < this.getPaletteColorizer().getNumberOfColors(); i++) {
            this.colorMap.set(i, this.getPaletteColorizer().getColorAtIndex(i));
        }

        // Fill allColors List with ColorAttributeInputs based on breakpoints
        for (const bp of this.getPaletteColorizer().getBreakpoints()) {
            const newInput = {key: bp.value.toString(), value: bp.color};
            this.allColors.push(newInput);
        }
    }

    setSymbology(newSymbology: RasterSymbology): void {
        this.symbology = newSymbology;
    }

    getColors(): Map<number, Color> {
        return this.colorMap;
    }

    debugClick(): void {
        // console.log(this.allColors);
    }

    getPaletteColorizer(): PaletteColorizer {
        return this.symbology.colorizer as PaletteColorizer;
    }

    createColorAttributeInputs(): ColorAttributeInput[] {
        const inputs: ColorAttributeInput[] = [];
        for (let i = 0; i < this.getPaletteColorizer().getNumberOfColors(); i++) {
            const newColor: ColorAttributeInput = {key: i.toString(), value: this.getPaletteColorizer().getColorAtIndex(i)};
            inputs.push(newColor);
            this.colorMap.set(i, newColor.value);
        }
        return inputs;
    }

    // Currently not used ... everything is done by rebuildColorMap, can be deleted...
    updateColor(pos: number, color: ColorAttributeInput): void {
        this.allColors[pos] = color; // because else, changes to HTML won't affect allColors
        this.colorMap.set(parseInt(color.key, 10), color.value); // Sets the key/value in the map according to the ColorAttributeInput. Old map value still exists after this!

        this.emitSymbology();
    }

    /**
     * Recreate the color map so that only values for which a ColorAttributeInput exists
     * are contained within the map. This is necessary because the $event that gets
     * passed to updateColor won't contain the previous rasterValue to delete in manually at
     * the time of updating.
     */
    rebuildColorMap(pos: number, color: ColorAttributeInput): void {
        this.allColors[pos] = color; // need this, or changes to HTML won't affect allColors

        // Recreate the map
        this.colorMap = new Map<number, Color>();
        this.allColors.forEach((input: ColorAttributeInput) => {
            const colorKey: number = parseInt(input.key, 10);
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
        this.allColors.sort((a: ColorAttributeInput, b: ColorAttributeInput) => Math.sign(parseInt(a.key, 10) - parseInt(b.key, 10)));
    }

    addColorTab(): void {
        const breakpoints: ColorBreakpoint[] = this.getPaletteColorizer().getBreakpoints();
        // Determine a value so that the new tab will appear at the bottom of the list.
        const afterLast: string = (breakpoints[breakpoints.length - 1].value + 1).toString();
        const colorWhite: Color = new Color({r: 255, g: 255, b: 255, a: 1});
        const newTab: ColorAttributeInput = {key: afterLast, value: colorWhite};
        this.rebuildColorMap(this.allColors.length, newTab);
        this.sortColorAttributeInputs();
    }

    removeColorTab(index: number): void {
        const rasterValue: number = parseInt(this.allColors[index].key, 10);
        this.colorMap.delete(rasterValue);
        this.allColors.splice(index, 1);
        this.emitSymbology();
    }

    emitSymbology(): void {
        // Create a new symbology to emit
        const colorizer = this.getPaletteColorizer().cloneWith({colors: this.colorMap});
        this.symbology = this.symbology.cloneWith({colorizer});

        // Emit the change event to the parent component
        this.symbologyChanged.emit(this.symbology);
    }
}
