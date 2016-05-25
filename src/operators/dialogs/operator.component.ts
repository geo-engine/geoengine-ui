import {Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy,
        OnChanges, SimpleChange, OnInit, AfterViewInit, Optional} from '@angular/core';
import {NgControl} from '@angular/common';
import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MdDialog} from 'ng2-material';
import {DialogContainerComponent} from '../../components/dialogs/dialog-basics.component';

import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {LayerService} from '../../services/layer.service';
import {PlotService} from '../../plots/plot.service';
import {ProjectService} from  '../../services/project.service';
import {MappingQueryService} from '../../services/mapping-query.service';
import {RandomColorService} from '../../services/random-color.service';

import {Symbology} from '../../symbology/symbology.model';
import {Layer} from '../../models/layer.model';
import {ResultType, ResultTypes} from '../result-type.model';
import {Projection} from '../projection.model';

/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: 'wave-layer-selection',
    template: `
    <md-input-container class="md-block md-input-has-value">
        <label>Input {{id}}</label>
        <select *ngIf="layers.length > 0"
                [ngModel]="_selectedLayer" (ngModelChange)="selectedLayer.emit($event)">
            <option *ngFor="let layer of layers" [ngValue]="layer">
                {{layer.name}}
            </option>
        </select>
        <p *ngIf="layers.length <= 0">No Input Available</p>
        <input md-input type="hidden" value="0"><!-- HACK -->
    </md-input-container>
    `,
    directives: [MATERIAL_DIRECTIVES],
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

    private _selectedLayer: Layer<Symbology>;

    constructor(private changeDetectorRef: ChangeDetectorRef) {
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
                <wave-layer-selection [id]="id" [layers]="_layers"
                                      (selectedLayer)="updateLayer(i, $event)">
                </wave-layer-selection>
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
    directives: [MATERIAL_DIRECTIVES, LayerSelectionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerMultiSelectComponent implements OnChanges {

    /**
     * An array of possible layers.
     */
    @Input("layers") layers: Array<Layer<Symbology>>;

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
    @Output("selectedLayers") selectedLayers = new EventEmitter<Array<Layer<Symbology>>>();

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

    private add() {
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
            this.ids.push(toLetters(i));
        }
    }

}

export function toLetters(num: number): string {
    'use strict';
    let mod = num % 26;
    /* tslint:disable */
    let pow = num / 26 | 0;
    /* tslint:enable */
    let out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
    return pow ? this.toLetters(pow) + out : out;
}

export function fromLetters(str: string): number {
    'use strict';
    let out = 0;
    let len = str.length;
    let pos = len;
    while (--pos > -1) {
        out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
    }
    return out;
}

/**
 * This component allows selecting an output projection.
 */
@Component({
    selector: 'wave-reprojetion-selection',
    template: `
    <md-input-container class="md-block md-input-has-value">
        <label>Output Projection</label>
        <select [ngModel]="selectedProjection"
                (ngModelChange)="valueChange.emit($event)">
            <option *ngFor="let projection of projections" [ngValue]="projection">
                {{projection}}
            </option>
        </select>
        <input md-input type="hidden" value="0"><!-- HACK -->
    </md-input-container>
    `,
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReprojectionSelectionComponent implements AfterViewInit, OnChanges {

    /**
     * An array of layers that is traversed to get all projections.
     */
    @Input() layers: Array<Layer<Symbology>>;

    /**
     * This output emits the selected layer.
     */
    @Output() valueChange = new EventEmitter<Projection>();

    private projections: Array<Projection>;
    private selectedProjection: Projection;

    constructor(private changeDetectorRef: ChangeDetectorRef,
                @Optional() control: NgControl) {
        this.valueChange.subscribe((projection: Projection) => {
            this.selectedProjection = projection;
        });
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
                    this.valueChange.emit(this.layers[0].operator.projection);
                    break;
                default:
                    // DO NOTHING
            }
        }
    }

}

@Component({
    selector: 'wave-operator-buttons',
    template: `
    <md-dialog-actions>
        <button md-raised-button type="button" (click)="cancel.emit()">
            <span>Cancel</span>
        </button>
        <button md-raised-button class="md-primary" type="button" (click)="add.emit()">
            <span>Add</span>
        </button>
    </md-dialog-actions>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorButtonsComponent {
    @Output() add = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
}

@Component({
    selector: 'wave-operator-container',
    template: `
    <wave-dialog-container [title]="title">
        <ng-content></ng-content>
        <wave-operator-buttons actions (add)="add.emit()" (cancel)="cancel.emit()">
        </wave-operator-buttons>
    </wave-dialog-container>
    `,
    styles: [`
    md-content {
        margin-left: -24px;
        padding-left: 24px;
        margin-right: -24px;
        padding-right: 24px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    directives: [DialogContainerComponent, OperatorButtonsComponent],
})
export class OperatorContainerComponent {
    @Input() title: string;
    @Output() add = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    private windowHeight$: BehaviorSubject<number>;
    private windowWidth$: BehaviorSubject<number>;

    constructor() {
        this.windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerHeight)
                  .subscribe(this.windowHeight$);

        this.windowWidth$ = new BehaviorSubject(window.innerWidth);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerWidth)
                  .subscribe(this.windowWidth$);
    }
}

/**
 * This component is the base class for all operator types.
 */
@Component({
    selector: 'wave-operator',
    template: ``,
    directives: [LayerMultiSelectComponent, ReprojectionSelectionComponent],
    changeDetection: ChangeDetectionStrategy.Default,
})
export abstract class OperatorBaseComponent implements OperatorBase, OnInit, OnChanges {

    @Input() layerService: LayerService;
    @Input() plotService: PlotService;
    @Input() projectService: ProjectService;
    @Input() mappingQueryService: MappingQueryService;
    @Input() randomColorService: RandomColorService;

    protected layers: Array<Layer<Symbology>> = [];

    // types
    protected ResultTypes = ResultTypes; // tslint:disable-line:variable-name

    constructor() {}

    ngOnInit() {
        if (this.layers) {
            this.layers = this.layerService.getLayers();
        }
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) {
            switch (propName) {
                case 'layerService':
                    this.layers = this.layerService.getLayers();
                    break;
                default:
                    // DO NOTHING
            }
        }
    }

}

/**
 * This interface allows passing class instances as parameter.
 */
export interface OperatorBase {}

// export class OperatorDialogConfig /* extends MdDialogConfig */ {
//     layerService(layerService: LayerService): OperatorDialogConfig {
//         this.context.layerService = layerService;
//         return this;
//     }
//
//     plotService(plotService: PlotService): OperatorDialogConfig {
//         this.context.plotService = plotService;
//         return this;
//     }
//
//     projectService(projectService: ProjectService): OperatorDialogConfig {
//         this.context.projectService = projectService;
//         return this;
//     }
//
//     mappingQueryService(mappingQueryService: MappingQueryService) {
//         this.context.mappingQueryService = mappingQueryService;
//         return this;
//     }
//
//     randomColorService(randomColorService: RandomColorService) {
//         this.context.randomColorService = randomColorService;
//         return this;
//     }
// }
