import {combineLatest, Observable, ReplaySubject, Subject, BehaviorSubject, Subscription, of, zip, forkJoin} from 'rxjs';
import {first, map, mergeMap} from 'rxjs/operators';
import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    SimpleChange,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ChangeDetectorRef,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {ProjectService} from '../../../../project/project.service';
import {Layer, LayerMetadata, ResultType, ResultTypes} from '@geoengine/common';

/**
 * Singleton for a letter to number converter for ids.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const LetterNumberConverter = {
    /**
     * Convert a numeric id to a alphanumeric one.
     * Starting with `1`.
     */
    toLetters: (num: number): string => {
        const mod = num % 26;
        let pow = (num / 26) | 0; // eslint-disable-line no-bitwise
        // noinspection CommaExpressionJS
        const out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? LetterNumberConverter.toLetters(pow) + out : out;
    },

    /**
     * Convert an alphanumeric id to a numeric one.
     * Starting with `A`.
     */
    fromLetters: (str: string): number => {
        let out = 0;
        const len = str.length;
        let pos = len;
        while (--pos > -1) {
            out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
        }
        return out;
    },
};

export interface LayerDetails {
    expanded: boolean;
    description?: string;
    metadata?: LayerMetadata;
}

@Component({
    selector: 'geoengine-multi-layer-selection',
    templateUrl: './multi-layer-selection.component.html',
    styleUrls: ['./multi-layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiLayerSelectionComponent), multi: true}],
    standalone: false,
})
export class MultiLayerSelectionComponent implements ControlValueAccessor, OnChanges, OnDestroy, OnInit {
    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer> | Observable<Array<Layer>> = this.projectService.getLayerStream();

    /**
     * The minimum number of elements to select.
     */
    @Input() min = 1;

    /**
     * The maximum number of elements to select.
     */
    @Input() max = 1;

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType> = ResultTypes.ALL_TYPES;

    /**
     * The title of the component (optional).
     */
    @Input() title?: string = undefined;

    onTouched?: () => void;
    onChange?: (_: Array<Layer>) => void = undefined;

    filteredLayers: Subject<Array<Layer>> = new ReplaySubject(1);
    selectedLayers = new BehaviorSubject<Array<Layer>>([]);

    hasLayers: Observable<boolean>;
    layersAtMin: Observable<boolean>;
    layersAtMax: Observable<boolean>;

    layerDetails: Array<LayerDetails> = [];

    private selectionSubscription: Subscription;
    private layerChangesSubscription?: Subscription;

    constructor(
        private projectService: ProjectService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {
        this.selectionSubscription = this.selectedLayers.subscribe((selectedLayers) => {
            if (this.onChange) {
                this.onChange(selectedLayers);
            }
        });

        this.hasLayers = this.filteredLayers.pipe(map((layers) => layers.length > 0));
        this.layersAtMin = combineLatest([this.selectedLayers, this.hasLayers]).pipe(
            map(([selectedLayers, hasLayers]) => !hasLayers || selectedLayers.length <= this.min),
        );
        this.layersAtMax = combineLatest([this.selectedLayers, this.hasLayers]).pipe(
            map(([selectedLayers, hasLayers]) => !hasLayers || selectedLayers.length >= this.max),
        );
    }

    /**
     * A function for naming the individual raster selections
     */
    @Input() inputNaming: (index: number) => string = (idx) => 'Input ' + this.toLetters(idx);

    ngOnInit(): void {
        this.updateLayersForSelection();
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}): void {
        let minMaxChanged = false;

        // eslint-disable-next-line guard-for-in
        for (const propName in changes) {
            switch (propName) {
                case 'min':
                case 'max':
                    minMaxChanged = true;
                    break;
                case 'layers':
                case 'types': {
                    let layers$: Observable<Array<Layer>>;
                    if (this.layers instanceof Array) {
                        layers$ = of(this.layers);
                    } else {
                        layers$ = this.layers;
                    }

                    if (this.layerChangesSubscription) {
                        this.layerChangesSubscription.unsubscribe();
                    }

                    this.layerChangesSubscription = layers$
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

                    if (this.title === undefined) {
                        this.title = this.types.map((type) => type.toString()).join(', ');
                    }

                    break;
                }

                default:
                // DO NOTHING
            }
        }

        if (minMaxChanged) {
            this.updateLayersForSelection();
        }
    }

    updateLayer(index: number, layer: Layer): void {
        const newSelectedLayers = [...this.selectedLayers.value];
        newSelectedLayers[index] = layer;
        this.selectedLayers.next(newSelectedLayers);
        this.layerDetails[index] = {expanded: false};
    }

    updateLayersForSelection(): void {
        combineLatest([this.filteredLayers, this.selectedLayers])
            .pipe(first())
            .subscribe(([filteredLayers, selectedLayers]) => {
                const amountOfLayers = selectedLayers.length;

                if (this.max < amountOfLayers) {
                    // remove selected layers
                    const difference = amountOfLayers - this.max;
                    this.selectedLayers.next(selectedLayers.slice(0, amountOfLayers - difference));
                    this.layerDetails = this.layerDetails.slice(0, amountOfLayers - difference);
                } else if (this.min > amountOfLayers) {
                    // add selected layers
                    const difference = this.min - amountOfLayers;
                    this.selectedLayers.next(selectedLayers.concat(this.layersForInitialSelection(filteredLayers, [], difference)));
                    this.layerDetails = this.layerDetails.concat(
                        Array(difference)
                            .fill(null)
                            .map(() => ({expanded: false})),
                    );
                }
            });
    }

    ngOnDestroy(): void {
        this.selectionSubscription.unsubscribe();

        if (this.layerChangesSubscription) {
            this.layerChangesSubscription.unsubscribe();
        }
    }

    add(): void {
        combineLatest([this.filteredLayers, this.selectedLayers])
            .pipe(first())
            .subscribe(([filteredLayers, selectedLayers]) => {
                this.selectedLayers.next(selectedLayers.concat(this.layersForInitialSelection(filteredLayers, selectedLayers, 1)));
                this.layerDetails = this.layerDetails.concat([{expanded: false}]);
                this.onBlur();
            });
    }

    remove(): void {
        this.selectedLayers.pipe(first()).subscribe((selectedLayers) => {
            this.selectedLayers.next(selectedLayers.slice(0, selectedLayers.length - 1));
            this.layerDetails = this.layerDetails.slice(0, selectedLayers.length - 1);
            this.onBlur();
        });
    }

    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }

    writeValue(layers: Array<Layer>): void {
        if (layers) {
            this.selectedLayers.next(layers);
        } else if (this.onChange) {
            this.onChange(this.selectedLayers.getValue());
        }
    }

    registerOnChange(fn: (_: Array<Layer>) => void): void {
        this.onChange = fn;

        this.onChange(this.selectedLayers.getValue());
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    // noinspection JSMethodCanBeStatic
    toLetters(i: number): string {
        return LetterNumberConverter.toLetters(i + 1);
    }

    toggleExpand(i: number): void {
        const layer = this.selectedLayers.value[i];
        const details = this.layerDetails[i];
        if (layer) {
            details.expanded = !details.expanded;
            if (!details.metadata) {
                this.projectService.getLayerMetadata(layer).subscribe((resultDescriptor) => {
                    details.metadata = resultDescriptor;
                    this.changeDetectorRef.markForCheck();
                });
            }
        }
    }

    private layersForInitialSelection(layers: Array<Layer>, blacklist: Array<Layer>, amount: number): Array<Layer> {
        if (layers.length === 0) {
            return [];
        }

        const layersForSelection = [...layers].filter((layer) => blacklist.indexOf(layer) < 0);

        while (layersForSelection.length < amount) {
            layersForSelection.push(layers[0]);
        }

        return layersForSelection.slice(0, amount);
    }
}
