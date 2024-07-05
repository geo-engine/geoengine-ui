import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Pipe,
    PipeTransform,
    SimpleChanges,
} from '@angular/core';
import {ProjectService} from '../../../project/project.service';
import {Subject, Subscription, first} from 'rxjs';
import {ColorBreakpoint, RasterLayer, RasterLayerMetadata, SingleBandRasterColorizer} from '@geoengine/common';
import {RasterBandDescriptor, Measurement, ContinuousMeasurement, ClassificationMeasurement} from '@geoengine/openapi-client';

/**
 * calculate the decimal places for the legend of raster data
 */
export function calculateNumberPipeParameters(breakpoints: Array<ColorBreakpoint>): string {
    //minimal and maximal breakpoint
    const firstNumber = (breakpoints[0].value as number).toString(10);
    const lastNumber = (breakpoints[breakpoints.length - 1].value as number).toString(10);
    //maximal decimal places of the minimal and maximal breakpoint
    const decimalPlacesFirst = firstNumber.indexOf('.') >= 0 ? firstNumber.split('.')[1].length : 0;
    const decimalPlacesLast = lastNumber.indexOf('.') >= 0 ? lastNumber.split('.')[1].length : 0;
    const maximumDecimalPlaces = Math.max(decimalPlacesFirst, decimalPlacesLast);
    //stepsize
    const range = breakpoints[breakpoints.length - 1].value - breakpoints[0].value;
    const steps = breakpoints.length - 1;
    const stepSize = range / steps;

    if (stepSize >= 1) return `1.0-${Math.max(0, maximumDecimalPlaces)}`;
    else if (stepSize >= 0.1) return `1.0-${Math.max(1, maximumDecimalPlaces)}`;
    else return `1.0-${Math.max(2, maximumDecimalPlaces)}`;
}

@Pipe({
    name: 'classificationMeasurement',
    pure: true,
})
export class CastMeasurementToClassificationPipe implements PipeTransform {
    transform(value: Measurement, _args?: unknown): ClassificationMeasurement | null {
        if (value.type == 'classification') {
            return value;
        } else {
            return null;
        }
    }
}

@Pipe({
    name: 'continuousMeasurement',
    pure: true,
})
export class CastMeasurementToContinuousPipe implements PipeTransform {
    transform(value: Measurement, _args?: unknown): ContinuousMeasurement | null {
        if (value.type == 'continuous') {
            return value;
        } else {
            return null;
        }
    }
}

export function unifyDecimals(values: number[]): number[] {
    // Early return if all values differ by more than 1
    if (oneApart(values.map((x) => Math.floor(x)).sort((a, b) => a - b))) {
        return values.map((x) => Math.floor(x));
    }

    // Find highest overlap for cut-off point
    let maxOverlap = 0;
    for (let i = 0; i < values.length - 1; i++) {
        const overlap: number = overlappingDigits(values[i], values[i + 1]);
        maxOverlap = overlap > maxOverlap ? overlap : maxOverlap;
    }

    return values.map((x) => {
        const preDecimals = Math.floor(x).toString().length;
        const roundAt = Math.pow(10, Math.max(0, maxOverlap + 2 - preDecimals));
        return Math.floor(x * roundAt) / roundAt;
    });
}

export function overlappingDigits(val1: number, val2: number): number {
    let overlap = 0;
    const str1 = val1.toString();
    const str2 = val2.toString();
    const maxLength = Math.min(str1.length, str2.length);
    let passedDecimal = false;
    for (let i = 0; i < maxLength; i++) {
        if (str1.charAt(i) === '.' && str2.charAt(i) === '.') {
            passedDecimal = true;
        }
        if (str1.charAt(i) !== str2.charAt(i)) {
            break;
        }
        overlap++;
    }
    return passedDecimal ? overlap - 1 : overlap;
}

export function oneApart(values: number[]): boolean {
    let apart = true;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i + 1] - values[i] < 1) {
            apart = false;
            break;
        }
    }
    return apart;
}

/**
 * The raster legend component.
 */
@Component({
    selector: 'geoengine-raster-legend',
    templateUrl: 'raster-legend.component.html',
    styleUrls: ['raster-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterLegendComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() layer!: RasterLayer;
    selectedBand$ = new Subject<RasterBandDescriptor>();
    displayedBreakpoints: number[] = [];

    @Input()
    orderValuesDescending = false;

    @Input()
    showSingleBandNames = true;

    @Input()
    detectChanges = false; // workaround to force change detection

    private layerMetaDataSubscription?: Subscription;

    constructor(
        public projectService: ProjectService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.calculateDisplayedBreakpoints();
    }

    ngAfterViewInit(): void {
        this.layerMetaDataSubscription = this.projectService
            .getLayerMetadata(this.layer)
            .pipe(first())
            .subscribe((m) => {
                const bands = (m as RasterLayerMetadata).bands;
                const bandIndex = (this.layer.symbology.rasterColorizer as SingleBandRasterColorizer).band;
                this.selectedBand$.next(bands[bandIndex]);

                if (this.detectChanges) {
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer || changes.orderValuesDescending) {
            this.calculateDisplayedBreakpoints();
        }
        if (!changes.showSingleBandNames == undefined) {
            this.changeDetectorRef.markForCheck();
        }
    }

    ngOnDestroy(): void {
        if (this.layerMetaDataSubscription) {
            this.layerMetaDataSubscription.unsubscribe();
        }
    }

    protected calculateDisplayedBreakpoints(): void {
        this.displayedBreakpoints = this.layer.symbology.rasterColorizer.getBreakpoints().map((x) => x.value);
        this.displayedBreakpoints = unifyDecimals(this.displayedBreakpoints);

        if (this.orderValuesDescending) {
            this.displayedBreakpoints = this.displayedBreakpoints.reverse();
        }
    }

    get gradientAngle(): number {
        return this.orderValuesDescending ? 0 : 180;
    }

    get colorizerBreakpoints(): Array<ColorBreakpoint> {
        if (this.orderValuesDescending) {
            return this.layer.symbology.rasterColorizer.getBreakpoints().slice().reverse();
        } else {
            return this.layer.symbology.rasterColorizer.getBreakpoints();
        }
    }
}
