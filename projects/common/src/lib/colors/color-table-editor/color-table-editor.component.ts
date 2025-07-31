import {CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf} from '@angular/cdk/scrolling';
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges,
    inject,
    input,
    output,
    viewChild,
} from '@angular/core';
import {WHITE} from '../color';
import {
    ColorAttributeInput,
    ColorAttributeInputHinter,
    ColorAttributeInputComponent,
} from '../color-attribute-input/color-attribute-input.component';
import {ColorBreakpoint} from '../color-breakpoint.model';
import {Measurement} from '@geoengine/openapi-client';
import {ClassificationMeasurement} from '../../layers/measurement';
import {FormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'geoengine-color-table-editor',
    templateUrl: './color-table-editor.component.html',
    styleUrls: ['./color-table-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        ColorAttributeInputComponent,
        FormsModule,
        MatIconButton,
        MatIcon,
    ],
})
export class ColorTableEditorComponent implements OnInit, OnChanges {
    private ref = inject(ChangeDetectorRef);

    // Symbology to use for creating color tabs
    readonly colorTable = input.required<Array<ColorBreakpoint>>();

    readonly measurement = input<Measurement>();

    // Symbology altered through color tab inputs
    readonly colorTableChanged = output<Array<ColorBreakpoint>>();

    readonly virtualScrollViewport = viewChild.required(CdkVirtualScrollViewport);

    colorAttributes: Array<ColorAttributeInput> = [];
    colorHints?: ColorAttributeInputHinter;

    ngOnInit(): void {
        this.updateColorAttributes();
        const measurement = this.measurement();
        if (measurement instanceof ClassificationMeasurement) {
            this.colorHints = measurement as ColorAttributeInputHinter;
        }
    }

    ngOnChanges(_changes: SimpleChanges): void {
        this.updateColorAttributes();
    }

    updateColorAttributes(): void {
        this.colorAttributes = this.colorTable().map((color: ColorBreakpoint) => {
            return {key: color.value.toString(), value: color.color};
        });
        this.ref.detectChanges();
    }

    /**
     * Recreate the color map so that only values for which a ColorAttributeInput exists
     * are contained within the map. This is necessary because the $event that gets
     * passed to updateColor won't contain the previous rasterValue to delete in manually at
     * the time of updating.
     */
    updateColorAt(index: number, color: ColorAttributeInput): void {
        this.colorAttributes.splice(index, 1, color);

        // TODO: only sort if necessary
        this.sortColorAttributeInputs();

        this.emitColorTable();
    }

    removeColorAt(index: number): void {
        this.colorAttributes.splice(index, 1);
        this.colorAttributes = [...this.colorAttributes]; // new array

        setTimeout(() => this.ref.detectChanges());

        this.emitColorTable();
    }

    /**
     * Sort allColors by raster layer values, so ColorAttributeInputs are displayed in the correct order.
     * Only called by parent when apply is pressed, so Inputs don't jump around while user is editing.
     */
    sortColorAttributeInputs(): void {
        this.colorAttributes = this.colorAttributes.sort((a: ColorAttributeInput, b: ColorAttributeInput) =>
            Math.sign(parseFloat(a.key) - parseFloat(b.key)),
        );

        setTimeout(() => this.ref.markForCheck());
    }

    appendColor(): void {
        let newValue;
        if (this.colorAttributes.length) {
            // Determine a value so that the new tab will appear at the bottom of the list.
            newValue = parseFloat(this.colorAttributes[this.colorAttributes.length - 1].key) + 1;
        } else {
            newValue = 0;
        }

        this.colorAttributes = [...this.colorAttributes, {key: newValue.toString(), value: WHITE}];

        // TODO: do we need that?
        this.sortColorAttributeInputs();

        setTimeout(() => this.virtualScrollViewport().scrollTo({bottom: 0}), 0); // Delay of 0 to include new tab in scroll

        this.emitColorTable();
    }

    isNoNumber(index: number): boolean {
        return isNaN(Number(this.colorAttributes[index].key));
    }

    emitColorTable(): void {
        let hadError = false;

        const colorTable: Array<ColorBreakpoint> = this.colorAttributes.map((color: ColorAttributeInput) => {
            const value = Number(color.key);

            if (isNaN(value)) {
                hadError = true;
            }

            return new ColorBreakpoint(value, color.value);
        });

        if (hadError) {
            return;
        }

        this.colorTableChanged.emit(colorTable);
    }
}
