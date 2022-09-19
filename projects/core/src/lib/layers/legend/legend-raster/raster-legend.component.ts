import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, Pipe, PipeTransform, SimpleChanges} from '@angular/core';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {ClassificationMeasurement, ContinuousMeasurement, Measurement} from '../../measurement';
import {ProjectService} from '../../../project/project.service';
import {map} from 'rxjs/operators';
import {RasterLayerMetadata} from '../../layer-metadata.model';
import {Observable} from 'rxjs';
import {RasterLayer} from '../../layer.model';

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
    transform(value: any, _args?: any): ClassificationMeasurement | null {
        if (value instanceof ClassificationMeasurement) {
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
    transform(value: any, _args?: any): ContinuousMeasurement | null {
        if (value instanceof ContinuousMeasurement) {
            return value;
        } else {
            return null;
        }
    }
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
export class RasterLegendComponent implements OnInit, OnChanges {
    @Input() layer!: RasterLayer;
    measurement$?: Observable<Measurement>;

    /**
     * Parameters to use with the number pipe in the template.
     */
    @Input()
    numberPipeParameters = '1.0-0';

    constructor(public projectService: ProjectService) {}

    ngOnInit(): void {
        this.measurement$ = this.projectService.getLayerMetadata(this.layer).pipe(map((m) => (m as RasterLayerMetadata).measurement));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            const symbology = changes.layer.currentValue.symbology;
            this.numberPipeParameters = calculateNumberPipeParameters(symbology.colorizer.getBreakpoints());
        }
    }

    shortenDecimals(toShorten: number): number {
        const integerPart: number = Math.floor(toShorten);
        const decimals: number = toShorten - integerPart;
        const decimalsString = decimals.toString();
        const DECIMAL_PLACES = 3; // decimal places left after rounding
        let zeroes: number = 0; 
        while (decimalsString.charAt(zeroes+2) === '0') {
            zeroes++;
        }
        const roundAt: number = (Math.pow(10, zeroes + DECIMAL_PLACES));
        return integerPart + Math.round(decimals * roundAt) / roundAt;
    }
}