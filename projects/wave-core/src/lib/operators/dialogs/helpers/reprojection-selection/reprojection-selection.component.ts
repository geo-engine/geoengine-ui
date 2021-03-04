import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    AfterViewInit,
    OnChanges,
    SimpleChange,
    ChangeDetectorRef,
    Input,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {Projection} from '../../../projection.model';
import {Layer} from '../../../../layers/layer.model';
import {AbstractSymbology} from '../../../../layers/symbology/symbology.model';

@Component({
    selector: 'wave-reprojection-selection',
    templateUrl: './reprojection-selection.component.html',
    styleUrls: ['./reprojection-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReprojectionSelectionComponent), multi: true}],
})
export class ReprojectionSelectionComponent implements OnChanges, ControlValueAccessor {
    /**
     * An array of layers that is traversed to get all projections.
     */
    @Input() layers: Array<Layer<AbstractSymbology>>;

    projections: Array<Projection>;
    selectedProjection: Projection;

    private onTouched: () => void;
    private onChange: (_: Projection) => void = undefined;

    private firstUndefined = true;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        for (let propName in changes) {
            // eslint-disable-line guard-for-in
            switch (propName) {
                case 'layers':
                    this.projections = [];
                    if (this.layers) {
                        for (const layer of this.layers) {
                            let projection = layer.operator.projection;
                            if (this.projections.indexOf(projection) === -1) {
                                this.projections.push(projection);
                            }
                        }
                        if (this.projections.length > 0 && this.projections.indexOf(this.selectedProjection) < 0) {
                            this.selectedProjection = this.layers[0].operator.projection;
                            if (this.onChange) {
                                this.onChange(this.selectedProjection);
                            }
                        }
                    } else {
                        this.selectedProjection = undefined;
                    }

                    setTimeout(() => this.changeDetectorRef.markForCheck());
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
        if (this.firstUndefined && !value) {
            this.firstUndefined = false;
        } else {
            this.selectedProjection = value;
        }

        this.changeDetectorRef.markForCheck();
    }

    /**
     * Implemented as part of ControlValueAccessor.
     */
    registerOnChange(fn: (_: Projection) => void): void {
        this.onChange = fn;

        if (this.selectedProjection) {
            this.onChange(this.selectedProjection);
        }
    }

    /**
     * Implemented as part of ControlValueAccessor.
     */
    registerOnTouched(fn: () => {}) {
        this.onTouched = fn;
    }

    selectProjection(projection: Projection) {
        this.selectedProjection = projection;
        if (this.onChange) {
            this.onChange(projection);
        }
    }
}
