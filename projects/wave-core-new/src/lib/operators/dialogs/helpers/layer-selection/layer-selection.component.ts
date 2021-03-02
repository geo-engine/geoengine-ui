import { ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Layer } from '../../../../layers/layer.model';
import { BehaviorSubject, forkJoin, from, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { ResultType, ResultTypes } from '../../../result-type.model';
import { ProjectService } from '../../../../project/project.service';
import { first, mergeMap } from 'rxjs/operators';
import { LayerMetadata } from 'dist/wave-core/lib/layers/layer-metadata';

/**
 * This component allows selecting one layer.
 */
@Component({
    selector: 'wave-layer-selection',
    templateUrl: './layer-selection.component.html',
    styleUrls: ['./layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerSelectionComponent), multi: true },
    ],
})
export class LayerSelectionComponent implements OnChanges, OnDestroy, ControlValueAccessor {

    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer> | Observable<Array<Layer>> = this.projectService.getLayerStream();

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType> = ResultTypes.ALL_TYPES;

    /**
     * The title of the component (optional).
     */
    @Input() title: string = undefined;

    onTouched: () => void;
    onChange: (_: Layer) => void = undefined;

    filteredLayers: Subject<Array<Layer>> = new ReplaySubject(1);
    selectedLayer = new BehaviorSubject<Layer>(undefined);

    private subscriptions: Array<Subscription> = [];

    constructor(private readonly projectService: ProjectService) {
        this.subscriptions.push(
            this.filteredLayers.subscribe(filteredLayers => {
                if (filteredLayers.length > 0) {
                    this.selectedLayer.pipe(first()).subscribe(selectedLayer => {
                        if (!selectedLayer) {
                            this.selectedLayer.next(filteredLayers[0]);
                            return;
                        }

                        const selectedLayerIndex = filteredLayers.indexOf(selectedLayer);
                        if (selectedLayerIndex >= 0) {
                            this.selectedLayer.next(filteredLayers[selectedLayerIndex]);
                        } else {
                            this.selectedLayer.next(filteredLayers[0]);
                        }
                    });
                } else {
                    this.selectedLayer.next(undefined);
                }
            })
        );

        this.subscriptions.push(
            this.selectedLayer.subscribe(selectedLayer => {
                if (this.onChange) {
                    this.onChange(selectedLayer);
                }
            })
        );
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.layers || changes.types) {
            if (this.layers instanceof Observable) {
                this.layers.pipe(first()).subscribe(layers => {
                    let o = layers.map(l => this.projectService.getLayerMetadata(l));

                    forkJoin(o).subscribe(meta => this.filteredLayers.next(
                        layers.filter((layer: Layer, i) => {
                            return this.types.map(t => meta[i].isOfResultType(t)).includes(true);
                        })
                    ));
                });
            } else if (this.layers instanceof Array) {
                const layers = this.layers as Array<Layer>;
                let o = layers.map(l => this.projectService.getLayerMetadata(l));

                forkJoin(o).subscribe(meta => this.filteredLayers.next(
                    layers.filter((layer: Layer, i) => {
                        return this.types.map(t => meta[i].isOfResultType(t)).includes(true);
                    })
                ));
            }

            if (this.title === undefined) {
                // set title out of types
                this.title = this.types
                    .map(type => type.toString())
                    .map(name => name.endsWith('s') ? name.substr(0, name.length - 1) : name)
                    .join(', ');
            }
        }
    }

    onBlur() {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layer: Layer): void {
        if (layer !== null) {
            this.selectedLayer.next(layer);
        }
    }

    registerOnChange(fn: (_: Layer) => void): void {
        this.onChange = fn;

        this.onChange(this.selectedLayer.getValue());
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setSelectedLayer(layer: Layer) {
        this.selectedLayer.next(layer);
    }
}
