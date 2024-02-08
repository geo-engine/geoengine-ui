import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild} from '@angular/core';
import {WHITE} from '../color';
import {ColorAttributeInput, ColorAttributeInputHinter} from '../color-attribute-input/color-attribute-input.component';
import {ColorBreakpoint} from '../color-breakpoint.model';
// import {ClassificationMeasurement, Measurement} from '../../layers/measurement';

@Component({
    selector: 'geoengine-color-table-editor',
    templateUrl: './color-table-editor.component.html',
    styleUrls: ['./color-table-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorTableEditorComponent implements OnInit {
    // Symbology to use for creating color tabs
    @Input() colorTable!: Array<ColorBreakpoint>;

    // @Input() measurement?: Measurement;

    // Symbology altered through color tab inputs
    @Output() colorTableChanged = new EventEmitter<Array<ColorBreakpoint>>();

    @ViewChild(CdkVirtualScrollViewport)
    virtualScrollViewport!: CdkVirtualScrollViewport;

    colorAttributes: Array<ColorAttributeInput> = [];
    colorHints?: ColorAttributeInputHinter;

    constructor(private ref: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.updateColorAttributes();

        // if (this.measurement instanceof ClassificationMeasurement) {
        //     this.colorHints = this.measurement as ColorAttributeInputHinter;
        // }
    }

    updateColorAttributes(): void {
        this.colorAttributes = this.colorTable.map((color: ColorBreakpoint) => {
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

        setTimeout(() => this.virtualScrollViewport.scrollTo({bottom: 0}), 0); // Delay of 0 to include new tab in scroll

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
