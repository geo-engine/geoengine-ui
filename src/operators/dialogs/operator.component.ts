import {
    Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy,
    OnChanges, SimpleChange, OnInit, AfterViewInit, Provider,
} from '@angular/core';
import {COMMON_DIRECTIVES, NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/common';

import {BehaviorSubject, Subscription} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {BasicDialog, DialogInput} from '../../dialogs/basic-dialog.component';

import {LayerService} from '../../layers/layer.service';
import {LayoutService, Browser} from '../../app/layout.service';

import {Symbology} from '../../symbology/symbology.model';
import {Layer} from '../../layers/layer.model';
import {ResultType, ResultTypes} from '../result-type.model';
import {Projection} from '../projection.model';

/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: 'wave-layer-selection',
    template: `
    <div [ngSwitch]="layers.length">
        <label>Input {{id}}</label>
        <select
            *ngSwitchDefault
            [ngModel]="_selectedLayer" (ngModelChange)="selectedLayer.emit($event)"
            [size]="layoutService.getBrowser() === Browser.FIREFOX ? 2 : 1"
        >
            <option *ngFor="let layer of layers" [ngValue]="layer">{{layer.name}}</option>
        </select>
        <p *ngSwitchCase="0">No Input Available</p>
    </div>
    `,
    styles: [`
    label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
    }
    `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerSelectionComponent implements AfterViewInit, OnChanges {

    /**
     * This id gets display alongside to the select element.
     */
    @Input() id: string;

    /**
     * An array of selectible layers.
     */
    @Input() layers: Array<Layer<Symbology>>;

    /**
     * This output emits the selected layer.
     */
    @Output('selectedLayer') selectedLayer = new EventEmitter<Layer<Symbology>>();

    Browser = Browser; // tslint:disable-line:variable-name

    private _selectedLayer: Layer<Symbology>;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private layoutService: LayoutService
    ) {
        this.selectedLayer.subscribe((layer: Layer<Symbology>) => this._selectedLayer = layer);
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
                    if (this.layers.length > 0) {
                        this.selectedLayer.emit(this.layers[0]);
                    }
                    break;
                default:
                    // do nothing
            }
        }
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
    <md-card>
        <md-card-header>
            <md-card-header-text>
                <div class="md-title" layout="row">
                    <span flex="grow">{{title}}</span>
                    <span>
                        <button md-button class="md-icon-button md-primary amount-button"
                                aria-label="Add" (click)="add()"
                                [disabled]="amountOfLayers>=max || _layers.length <= 0">
                            <i md-icon>add_circle_outline</i>
                        </button>
                        <button md-button class="md-icon-button md-primary amount-button"
                                aria-label="Remove" (click)="remove()"
                                [disabled]="amountOfLayers<=min || _layers.length <= 0">
                            <i md-icon>remove_circle_outline</i>
                        </button>
                    </span>
                </div>
                <span class="md-subheader">Select input {{title}}</span>
            </md-card-header-text>
        </md-card-header>
        <md-card-content layout="row">
            <div *ngFor="let id of ids; let i = index" layout="row">
                <wave-layer-selection
                    [id]="id"
                    [layers]="_layers"
                    (selectedLayer)="updateLayer(i, $event)"
                ></wave-layer-selection>
            </div>
        </md-card-content>
    </md-card>
    `,
    styles: [`
    button.amount-button{
        width: 24px;
        height: 24px;
        padding: 0px;
        margin: 0px 0px;
    }
    button.amount-button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, LayerSelectionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerMultiSelectComponent implements OnChanges {

    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer<Symbology>>;

    /**
     * The minimum number of elements to select.
     */
    @Input() min: number = 1;

    /**
     * The maximum number of elements to select.
     */
    @Input() max: number = 1;

    @Input() initialAmount = 1;

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType>;

    /**
     * The title of the component (optional).
     */
    @Input() title: string = undefined;

    /**
     * This output emits the selected layer.
     */
    @Output() selectedLayers = new EventEmitter<Array<Layer<Symbology>>>();

    private amountOfLayers: number = 1;

    private _layers: Array<Layer<Symbology>>;
    private ids: Array<string>;

    private _selectedLayers: Array<Layer<Symbology>> = [];

    constructor() {
        this.selectedLayers.subscribe((layers: Array<Layer<Symbology>>) => {
            this._selectedLayers = layers;
        });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) {
            switch (propName) {
                case 'initialAmount':
                    this.amountOfLayers = Math.max(this.initialAmount, this.min);
                /* falls through */
                case 'layers':
                case 'types':
                    this._layers = this.layers.filter((layer: Layer<Symbology>) => {
                        return this.types.indexOf(layer.operator.resultType) >= 0;
                    });
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

    updateLayer(index: number, layer: Layer<Symbology>) {
        this._selectedLayers[index] = layer;
        this.selectedLayers.emit(this._selectedLayers);
    }

    add() {
        this.amountOfLayers = Math.min(this.amountOfLayers + 1, this.max);
        this.recalculateIds();
    }

    remove() {
        this.amountOfLayers = Math.max(this.amountOfLayers - 1, this.min);
        this.recalculateIds();
        this._selectedLayers.pop();
        this.selectedLayers.emit(this._selectedLayers);
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
    directives: [MATERIAL_DIRECTIVES],
    providers: [
        new Provider(
            NG_VALUE_ACCESSOR, {
              useExisting: ReprojectionSelectionComponent,
              multi: true,
          }),
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
    <md-card>
        <md-card-header>
            <md-card-header-text>
                <span class="md-title">Output Name</span>
                <span class="md-subheader">Specify the name of the operator result</span>
            </md-card-header-text>
        </md-card-header>
        <md-card-content>
            <md-input
                placeholder="Output {{type}} Name"
                [ngModel]="name$ | async" (ngModelChange)="name$.next($event)"
                minLength="1"
                (blur)="onBlur()"
            ></md-input>
        </md-card-content>
    </md-card>
    `,
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    providers: [
        new Provider(
            NG_VALUE_ACCESSOR, {
              useExisting: OperatorOutputNameComponent,
              multi: true,
          }),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorOutputNameComponent implements ControlValueAccessor, OnDestroy {
    name$ = new BehaviorSubject<string>('');

    @Input() type: string = 'Layer';

    private onTouched: () => void;
    private changeSubscription: Subscription;

    ngOnDestroy() {
        if (this.changeSubscription) {
            this.changeSubscription.unsubscribe();
        }
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        this.name$.next(value);
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => {}) {
        if (this.changeSubscription) {
          this.changeSubscription.unsubscribe();
        }
        this.changeSubscription = this.name$.subscribe(fn);
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => {}) {
        if (this.onTouched) {
            this.onTouched = fn;
        }
    }
}

/**
 * This component is the base class for all operator types.
 */
export abstract class OperatorBaseComponent extends BasicDialog<DialogInput> implements OnInit {

    protected layers: Array<Layer<Symbology>> = [];
    protected addDisabled = new BehaviorSubject(false);

    // types
    protected ResultTypes = ResultTypes; // tslint:disable-line:variable-name

    constructor(
        protected layerService: LayerService
    ) {
        super();

        this.layers = this.layerService.getLayers();
    }

    /**
     * Sets defaults for title and buttons.
     * Call this with super if you override it!!!
     */
    ngOnInit() {
        this.dialog.setTitle('Operator'); // TODO: think about this to remove
        this.dialog.setButtons([
            {
                title: 'Add',
                class: 'md-primary',
                action: () => this.add(),
                disabled: this.addDisabled,
            },
            { title: 'Cancel', action: () => this.dialog.close() },
        ]);
    }

    abstract add(): void;

}
