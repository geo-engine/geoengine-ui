import {
    Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy,
    OnChanges, SimpleChange, OnInit, AfterViewInit, forwardRef,
} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs/Rx';

import {LayerService} from '../../../layers/layer.service';
import {LayoutService, Browser} from '../../layout.service';

import {Symbology} from '../../../symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {ResultType, ResultTypes} from '../result-type.model';
import {Projection} from '../projection.model';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: 'wave-layer-selection',
    template: `
    <md-select
        *ngIf="layers.length > 0"
        placeholder="Input {{id}}"
        [ngModel]="selectedLayer" (ngModelChange)="setSelectedLayer($event)"
        (onBlur)="onBlur()"
    >
      <md-option *ngFor="let layer of layers" [value]="layer">{{layer.name}}</md-option>
    </md-select>
    <p *ngIf="layers.length <= 0">No Input Available</p>
    `,
    styles: [``],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerSelectionComponent), multi: true},
    ],
})
export class LayerSelectionComponent implements AfterViewInit, OnChanges, ControlValueAccessor {

    /**
     * This id gets display alongside to the select element.
     */
    @Input() id: string;

    /**
     * An array of selectible layers.
     */
    @Input() layers: Array<Layer<Symbology>>;

    selectedLayer: Layer<Symbology>;

    onTouched: () => void;
    onChange: (_: Layer<Symbology>) => void = undefined;

    constructor(
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        // do this one time for ngMaterial
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (const propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'layers':
                    if (this.layers.length > 0) {
                        // this.selectedLayer = this.layers[0];
                        this.setSelectedLayer(this.layers[0]);
                    }
                    break;
                default:
                    // do nothing
            }
        }
    }

    setSelectedLayer(layer: Layer<Symbology>) {
        this.selectedLayer = layer;
        if (this.onChange) {
            this.onChange(layer);
        }
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layer: Layer<Symbology>): void {
        this.selectedLayer = layer;
        this.changeDetectorRef.markForCheck();
    }

    registerOnChange(fn: (_: Layer<Symbology>) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

}

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

/**
 * This component allows selecting multiple input operators.
 */
@Component({
    selector: 'wave-multi-layer-selection',
    template: `
    <div class="header">
        <wave-dialog-section-heading [title]="title" subtitle="Select input {{title}}"></wave-dialog-section-heading>
        <div>
            <button md-mini-fab
                (click)="add()"
                *ngIf="max - min > 0"
                [disabled]="amountOfLayers >= max || filteredLayers.length <= 0"
            ><md-icon>add_circle_outline</md-icon></button>
            <button md-mini-fab
                (click)="remove()"
                *ngIf="max - min > 0"
                [disabled]="amountOfLayers <= min || filteredLayers.length <= 0"
            ><md-icon>remove_circle_outline</md-icon></button>
        </div>
    </div>
    <div>
        <wave-layer-selection
            *ngFor="let id of ids; let i = index"
            [id]="id"
            [layers]="filteredLayers" [ngModel]="selectedLayers[i]" (ngModelChange)="updateLayer(i, $event)"
            (onBlur)="onBlur()"
        ></wave-layer-selection>
    </div>
    `,
    styles: [`
    :host {
        display: block;
        padding-bottom: 1em;
    }
    .header {
        display: flex;
    }
    .header div:first-child {
        flex-grow: 1;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerMultiSelectComponent), multi: true},
    ],
})
export class LayerMultiSelectComponent implements OnChanges, ControlValueAccessor, AfterViewInit {

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
        this.propagateChange();
        this.onBlur();
    }

    remove() {
        this.amountOfLayers = Math.max(this.amountOfLayers - 1, this.min);
        this.recalculateIds();
        this.selectedLayers.pop();
        this.propagateChange();
        this.onBlur();
    }

    onBlur() {
        if (this.onTouched()) {
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

/**
 * This component allows selecting an output projection.
 */
@Component({
    selector: 'wave-reprojetion-selection',
    template: `
    <div>
        <label>Output Projection</label>
        <select
            [ngModel]="selectedProjection"
            (ngModelChange)="valueChange.emit($event)"
            (blur)="onBlur()"
            [size]="layoutService.getBrowser() === Browser.FIREFOX ? 2 : 1"
        >
            <option
                *ngFor="let projection of projections"
                [ngValue]="projection"
            >{{projection}}</option>
        </select>
    </div>
    `,
    styles: [`
    label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
    }
    `],
    providers: [
      {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReprojectionSelectionComponent), multi: true},
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReprojectionSelectionComponent
    implements AfterViewInit, OnChanges, ControlValueAccessor {

    /**
     * An array of layers that is traversed to get all projections.
     */
    @Input() layers: Array<Layer<Symbology>>;

    /**
     * This output emits the selected layer.
     */
    @Output() valueChange = new EventEmitter<Projection>();

    Browser = Browser; // tslint:disable-line:variable-name

    private projections: Array<Projection>;
    private selectedProjection: Projection;

    private onTouched: () => void;
    private changeSubscription: { unsubscribe: () => {} } = undefined;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private layoutService: LayoutService
    ) {
        this.valueChange.subscribe((projection: Projection) => {
            this.selectedProjection = projection;
        });

        this.onTouched = () => {};
    }

    ngAfterViewInit() {
        // do this one time for ngMaterial
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        }, 0);
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) {
            switch (propName) {
                case 'layers':
                    if (this.layers.length === 0) {
                        // TODO: dummy entry
                    }
                    this.projections = [];
                    for (let layer of this.layers) {
                        let projeciton = layer.operator.projection;
                        if (this.projections.indexOf(projeciton) === -1) {
                            this.projections.push(projeciton);
                        }
                    }
                    if (this.layers.length > 0) {
                        this.valueChange.emit(this.layers[0].operator.projection);
                    }
                    break;
                default:
                    // DO NOTHING
            }
        }
    }

    /**
     * Informs the component when we lose focus in order to style accordingly
     * @internal
     */
    onBlur() {
        this.onTouched();
    }

    /**
     * Implemented as part of ControlValueAccessor.
     */
    writeValue(value: Projection) {
        this.valueChange.next(value);
    }

    /**
     * Implemented as part of ControlValueAccessor.
     */
    registerOnChange(fn: () => {}) {
        if (this.changeSubscription) {
          this.changeSubscription.unsubscribe();
        }
        this.changeSubscription = this.valueChange.subscribe(fn) as {unsubscribe: () => {}};
    }

    /**
     * Implemented as part of ControlValueAccessor.
     */
    registerOnTouched(fn: () => {}) {
        this.onTouched = fn;
    }

}

@Component({
    selector: 'wave-operator-output-name',
    template: `
    <wave-dialog-section-heading
        title="Output Name" subtitle="Specify the name of the operator result"
    ></wave-dialog-section-heading>
    <md-input
        placeholder="Output {{type}} Name"
        [(ngModel)]="name"
        minLength="1"
        (blur)="onBlur()"
    ></md-input>
    `,
    styles: [`
    h3 small {
        display: block;
        font-weight: normal;
    }
    `],
    providers: [
      {provide: NG_VALUE_ACCESSOR, useExisting: OperatorOutputNameComponent, multi: true},
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorOutputNameComponent implements ControlValueAccessor, AfterViewInit {
    @Input() type = 'Layer';

    private _name: string;
    private onTouched: () => void;
    private onChange: (_: string) => void = undefined;

    constructor(
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    set name(name: string) {
        this._name = name;
        if (this.onChange) {
            this.onChange(name);
        }
    }

    get name(): string {
        return this._name;
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        this._name = value;
        this.changeDetectorRef.markForCheck();
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => {}) {
        this.onChange = fn;
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => {}) {
        this.onTouched = fn;
    }
}
