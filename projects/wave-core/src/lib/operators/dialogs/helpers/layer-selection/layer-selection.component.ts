import {first} from 'rxjs/operators';
import {Observable, BehaviorSubject, ReplaySubject, Subject, Subscription} from 'rxjs';

import {Component, ChangeDetectionStrategy, forwardRef, Input, OnChanges, SimpleChange, OnDestroy} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {Layer} from '../../../../layers/layer.model';
import {AbstractSymbology} from '../../../../layers/symbology/symbology.model';
import {ResultType, ResultTypes} from '../../../result-type.model';
import {ProjectService} from '../../../../project/project.service';
import {LayerService} from '../../../../layers/layer.service';

/**
 * This component allows selecting one layer.
 */
@Component({
    selector: 'wave-layer-selection',
    templateUrl: './layer-selection.component.html',
    styleUrls: ['./layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerSelectionComponent), multi: true}],
})
export class LayerSelectionComponent implements OnChanges, OnDestroy, ControlValueAccessor {
    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer<AbstractSymbology>> | Observable<Array<Layer<AbstractSymbology>>> = this.projectService.getLayerStream();

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType> = ResultTypes.ALL_TYPES;

    /**
     * The title of the component (optional).
     */
    @Input() title: string = undefined;

    onTouched: () => void;
    onChange: (_: Layer<AbstractSymbology>) => void = undefined;

    filteredLayers: Subject<Array<Layer<AbstractSymbology>>> = new ReplaySubject(1);
    selectedLayer = new BehaviorSubject<Layer<AbstractSymbology>>(undefined);

    private subscriptions: Array<Subscription> = [];

    constructor(private layerService: LayerService, private projectService: ProjectService) {
        this.subscriptions.push(
            this.filteredLayers.subscribe((filteredLayers) => {
                if (filteredLayers.length > 0) {
                    this.selectedLayer.pipe(first()).subscribe((selectedLayer) => {
                        const selectedLayerIndex = filteredLayers.indexOf(
                            selectedLayer ? selectedLayer : this.layerService.getSelectedLayer(),
                        );
                        if (selectedLayerIndex >= 0) {
                            this.selectedLayer.next(filteredLayers[selectedLayerIndex]);
                        } else {
                            this.selectedLayer.next(filteredLayers[0]);
                        }
                    });
                } else {
                    this.selectedLayer.next(undefined);
                }
            }),
        );

        this.subscriptions.push(
            this.selectedLayer.subscribe((selectedLayer) => {
                if (this.onChange) {
                    this.onChange(selectedLayer);
                }
            }),
        );
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) {
            // tslint:disable-line:forin
            switch (propName) {
                /* falls through */
                case 'layers':
                case 'types':
                    if (this.layers instanceof Observable) {
                        this.layers.pipe(first()).subscribe((layers) => {
                            this.filteredLayers.next(
                                layers.filter((layer: Layer<AbstractSymbology>) => {
                                    return this.types.indexOf(layer.operator.resultType) >= 0;
                                }),
                            );
                        });
                    } else if (this.layers instanceof Array) {
                        this.filteredLayers.next(
                            this.layers.filter((layer: Layer<AbstractSymbology>) => {
                                return this.types.indexOf(layer.operator.resultType) >= 0;
                            }),
                        );
                    }

                    if (this.title === undefined) {
                        // set title out of types
                        this.title = this.types
                            .map((type) => type.toString())
                            .map((name) => (name.endsWith('s') ? name.substr(0, name.length - 1) : name))
                            .join(', ');
                    }

                    break;
                default:
                // do nothing
            }
        }
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layer: Layer<AbstractSymbology>): void {
        if (layer !== null) {
            this.selectedLayer.next(layer);
        }
    }

    registerOnChange(fn: (_: Layer<AbstractSymbology>) => void): void {
        this.onChange = fn;

        this.onChange(this.selectedLayer.getValue());
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setSelectedLayer(layer: Layer<AbstractSymbology>) {
        this.selectedLayer.next(layer);
    }
}
