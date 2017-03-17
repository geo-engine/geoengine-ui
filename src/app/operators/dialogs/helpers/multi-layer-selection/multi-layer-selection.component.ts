import {
    Component, OnInit, ChangeDetectionStrategy, forwardRef, SimpleChange, ChangeDetectorRef,
    Input, AfterViewInit, OnChanges
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {Layer} from '../../../../layers/layer.model';
import {Symbology} from '../../../../layers/symbology/symbology.model';
import {LayerService} from '../../../../layers/layer.service';
import {ResultType} from '../../../result-type.model';

/**
 * Singleton for a letter to number converter for ids.
 */
export const LetterNumberConverter = { // tslint:disable-line:variable-name
    /**
     * Convert a numeric id to a alphanumeric one.
     * Starting with `1`.
     */
    toLetters: (num: number) => {
        let mod = num % 26;
        let pow = num / 26 | 0; // tslint:disable-line:no-bitwise
        let out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? this.toLetters(pow) + out : out;
    },
    /**
     * Convert an alphanumeric id to a numeric one.
     * Starting with `A`.
     */
    fromLetters: (str: string) => {
        let out = 0;
        let len = str.length;
        let pos = len;
        while (--pos > -1) {
            out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
        }
        return out;
    },
};

@Component({
    selector: 'wave-multi-layer-selection',
    templateUrl: './multi-layer-selection.component.html',
    styleUrls: ['./multi-layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiLayerSelectionComponent), multi: true},
    ],
})
export class MultiLayerSelectionComponent implements ControlValueAccessor, AfterViewInit, OnChanges {

    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer<Symbology>> = this.layerService.getLayers();

    /**
     * The minimum number of elements to select.
     */
    @Input() min = 1;

    /**
     * The maximum number of elements to select.
     */
    @Input() max = 1;

    /**
     * The initial amount of elements to select.
     * @type {number}
     */
    @Input() initialAmount = 1;

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType>;

    /**
     * The title of the component (optional).
     */
    @Input() title: string = undefined;

    onTouched: () => void;
    onChange: (_: Array<Layer<Symbology>>) => void = undefined;

    filteredLayers: Array<Layer<Symbology>>;
    ids: Array<string>;

    amountOfLayers = 1;

    selectedLayers: Array<Layer<Symbology>> = [];

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private layerService: LayerService
    ) {}

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'initialAmount':
                    this.amountOfLayers = Math.max(this.initialAmount, this.min);
                /* falls through */
                case 'layers':
                case 'types':
                    this.filteredLayers = this.layers.filter((layer: Layer<Symbology>) => {
                        return this.types.indexOf(layer.operator.resultType) >= 0;
                    });
                    for (let i = 0; i < this.amountOfLayers; i++) {
                        this.updateLayer(i, this.filteredLayers[0]);
                    }
                    if (this.title === undefined) {
                        this.title = this.types.map(type => type.toString())
                            .join(', ');
                    }
                    break;
                case 'min':
                    this.amountOfLayers = Math.max(this.amountOfLayers, this.min);
                    break;
                case 'max':
                    this.amountOfLayers = Math.min(this.amountOfLayers, this.max);
                    break;
                default:
                // DO NOTHING
            }
        }
        this.recalculateIds();
    }

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    updateLayer(index: number, layer: Layer<Symbology>) {
        this.selectedLayers[index] = layer;
        this.propagateChange();
    }

    add() {
        this.amountOfLayers = Math.min(this.amountOfLayers + 1, this.max);
        this.recalculateIds();
        this.selectedLayers.push(this.filteredLayers[0]);

        setTimeout(() => this.changeDetectorRef.markForCheck());

        this.propagateChange();
        this.onBlur();
    }

    remove() {
        this.amountOfLayers = Math.max(this.amountOfLayers - 1, this.min);
        this.recalculateIds();
        this.selectedLayers.pop();

        setTimeout(() => this.changeDetectorRef.markForCheck());

        this.propagateChange();
        this.onBlur();
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layers: Array<Layer<Symbology>>): void {
        if (layers) {
            this.selectedLayers = layers;

            this.changeDetectorRef.markForCheck();
        } else {
            this.propagateChange();
        }
    }

    registerOnChange(fn: (_: Array<Layer<Symbology>>) => void): void {
        this.onChange = fn;

        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    private propagateChange() {
        if (this.onChange && this.selectedLayers && this.filteredLayers.length > 0) {
            this.onChange(this.selectedLayers);
        }
    }

    private recalculateIds() {
        this.ids = [];
        for (let i = 1; i <= this.amountOfLayers; i++) {
            this.ids.push(LetterNumberConverter.toLetters(i));
        }
    }

}
