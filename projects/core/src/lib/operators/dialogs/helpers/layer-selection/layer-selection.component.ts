import {ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Layer} from '../../../../layers/layer.model';
import {LayerMetadata} from '../../../../layers/layer-metadata.model';
import {BehaviorSubject, forkJoin, Observable, of, ReplaySubject, Subject, Subscription, zip} from 'rxjs';
import {ResultType, ResultTypes} from '../../../result-type.model';
import {ProjectService} from '../../../../project/project.service';
import {first, map, mergeMap} from 'rxjs/operators';

/**
 * This component allows selecting one layer.
 */
@Component({
    selector: 'geoengine-layer-selection',
    templateUrl: './layer-selection.component.html',
    styleUrls: ['./layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerSelectionComponent), multi: true}],
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
    @Input() title?: string = undefined;

    onTouched?: () => void;
    onChange?: (_: Layer | undefined) => void = undefined;

    filteredLayers: Subject<Array<Layer>> = new ReplaySubject(1);
    hasLayers: Observable<boolean>;
    selectedLayer = new BehaviorSubject<Layer | undefined>(undefined);

    private subscriptions: Array<Subscription> = [];

    constructor(private readonly projectService: ProjectService) {
        this.subscriptions.push(
            this.filteredLayers.subscribe((filteredLayers) => {
                if (filteredLayers.length > 0) {
                    this.selectedLayer.pipe(first()).subscribe((selectedLayer) => {
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
            }),
        );

        this.subscriptions.push(
            this.selectedLayer.subscribe((selectedLayer) => {
                if (this.onChange) {
                    this.onChange(selectedLayer);
                }
            }),
        );

        this.hasLayers = this.filteredLayers.pipe(map((layers) => layers.length > 0));
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layers || changes.types) {
            let layers$: Observable<Array<Layer>>;
            if (this.layers instanceof Array) {
                layers$ = of(this.layers);
            } else {
                layers$ = this.layers;
            }

            const sub = layers$
                .pipe(
                    mergeMap((layers) => {
                        const layersAndMetadata = layers.map((l) => zip(of(l), this.projectService.getLayerMetadata(l)));
                        return forkJoin(layersAndMetadata);
                    }),
                    map((layers: Array<[Layer, LayerMetadata]>) =>
                        layers.filter(([_layer, meta]) => this.types.indexOf(meta.resultType) >= 0).map(([layer, _]) => layer),
                    ),
                )
                .subscribe((l) => this.filteredLayers.next(l));
            this.subscriptions.push(sub);

            if (this.title === undefined) {
                // set title out of types
                this.title = this.types
                    .map((type) => type.toString())
                    .map((name) => (name.endsWith('s') ? name.substr(0, name.length - 1) : name))
                    .join(', ');
            }
        }
    }

    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layer: Layer): void {
        if (layer !== null) {
            this.selectedLayer.next(layer);
        }
    }

    registerOnChange(fn: (_: Layer | undefined) => void): void {
        this.onChange = fn;

        this.onChange(this.selectedLayer.getValue());
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setSelectedLayer(layer: Layer): void {
        this.selectedLayer.next(layer);
    }
}
