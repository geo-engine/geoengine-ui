import {
    Component, ChangeDetectionStrategy, forwardRef, Input, OnChanges, SimpleChange,
    ChangeDetectorRef
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {Layer} from '../../../../../layers/layer.model';
import {LayerService} from '../../../../../layers/layer.service';
import {Symbology} from '../../../../../symbology/symbology.model';
import {ResultType, ResultTypes} from '../../../result-type.model';

/**
 * This component allows selecting one layer.
 */
@Component({
    selector: 'wave-layer-selection',
    templateUrl: 'layer-selection.component.html',
    styleUrls: ['layer-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LayerSelectionComponent), multi: true},
    ],
})
export class LayerSelectionComponent implements OnChanges, ControlValueAccessor {

    /**
     * An array of possible layers.
     */
    @Input() layers: Array<Layer<Symbology>> = this.layerService.getLayers();

    /**
     * The type is used as a filter for the layers to choose from.
     */
    @Input() types: Array<ResultType> = ResultTypes.ALL_TYPES;

    /**
     * The title of the component (optional).
     */
    @Input() title: string = undefined;

    onTouched: () => void;
    onChange: (_: Layer<Symbology>) => void = undefined;

    filteredLayers: Array<Layer<Symbology>>;
    selectedLayer: Layer<Symbology> = undefined;

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService) {
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                /* falls through */
                case 'layers':
                case 'types':
                    this.filteredLayers = this.layers.filter((layer: Layer<Symbology>) => {
                        return this.types.indexOf(layer.operator.resultType) >= 0;
                    });
                    if (!this.selectedLayer && this.filteredLayers.length > 0) {
                        // if no layer is selected, use app selected layer or first one in list
                        const selectedLayerIndex = this.filteredLayers.indexOf(this.layerService.getSelectedLayer());
                        if (selectedLayerIndex >= 0) {
                            this.selectedLayer = this.filteredLayers[selectedLayerIndex];
                        } else {
                            this.selectedLayer = this.filteredLayers[0];
                        }
                    } else if (this.selectedLayer && this.filteredLayers.indexOf(this.selectedLayer) < 0) {
                        // we need to reset the selected layer because it is not part of the list anymore
                        this.selectedLayer = undefined;
                    }

                    this.propagateChange();

                    if (this.title === undefined) {
                        // set title out of types
                        this.title = this.types
                            .map(type => type.toString())
                            .map(name => name.endsWith('s') ? name.substr(0, name.length - 1) : name)
                            .join(', ');
                    }

                    setTimeout(() => this.changeDetectorRef.markForCheck(), 0);
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

    writeValue(layer: Layer<Symbology>): void {
        if (layer !== null) {
            this.selectedLayer = layer;
        }
        this.changeDetectorRef.markForCheck();
    }

    registerOnChange(fn: (_: Layer<Symbology>) => void): void {
        this.onChange = fn;

        this.propagateChange();
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setSelectedLayer(layer: Layer<Symbology>) {
        this.selectedLayer = layer;

        this.propagateChange();
    }

    private propagateChange() {
        if (this.onChange) {
            this.onChange(this.selectedLayer);
        }
    }

}
