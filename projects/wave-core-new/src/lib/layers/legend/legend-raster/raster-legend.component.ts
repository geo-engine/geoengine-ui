import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, Pipe, PipeTransform, SimpleChanges} from '@angular/core';
import {Interpolation, interpolationToName, Unit} from '../../../operators/unit.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {ContinuousMeasurement, Measurement} from '../../measurement';
import {ProjectService} from '../../../project/project.service';
import {map} from 'rxjs/operators';
import {RasterLayerMetadata} from '../../layer-metadata.model';
import {Observable} from 'rxjs';
import {RasterLayer} from '../../layer.model';

@Pipe({
    name: 'continuousMeasurement',
    pure: true,
})
export class CastMeasurementToContinuousPipe implements PipeTransform {
    transform(value: any, _args?: any): ContinuousMeasurement {
        return value;
    }
}

/**
 * The raster legend component.
 */
@Component({
    selector: 'wave-raster-legend',
    templateUrl: 'raster-legend.component.html',
    styleUrls: ['raster-legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterLegendComponent implements OnInit, OnChanges {
    @Input() layer: RasterLayer;
    measurement$: Observable<Measurement>;

    /**
     * Parameters to use with the number pipe in the template.
     */
    @Input()
    numberPipeParameters = '1.0-0';

    constructor(public projectService: ProjectService) {}

    /**
     * Get a string representation of a Unit.
     */
    unitToString(unit: Unit): string {
        if (unit instanceof Unit && unit.unit !== Unit.defaultUnit.unit) {
            return unit.unit;
        } else {
            return '';
        }
    }

    /**
     * Get the name of an interpolation.
     */
    interpolationToName(interpolation: Interpolation): string {
        return interpolationToName(interpolation);
    }

    ngOnInit(): void {
        this.measurement$ = this.projectService.getLayerMetadata(this.layer).pipe(map((m) => (m as RasterLayerMetadata).measurement));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.symbology) {
            const symbology = changes.symbology.currentValue;
            this.numberPipeParameters = RasterLegendComponent.calculateNumberPipeParameters(symbology.colorizer.breakpoints);
        }
    }

    private static calculateNumberPipeParameters(breakpoints: Array<ColorBreakpoint>): string {
        const firstNumber = (breakpoints[0].value as number).toString(10);
        const lastNumber = (breakpoints[breakpoints.length - 1].value as number).toString(10);
        const decimalPlacesFirst = firstNumber.indexOf('.') >= 0 ? firstNumber.split('.')[1].length : 0;
        const decimalPlacesLast = lastNumber.indexOf('.') >= 0 ? lastNumber.split('.')[1].length : 0;
        const maximumDecimalPlaces = Math.max(decimalPlacesFirst, decimalPlacesLast) + 2;

        return `1.0-${maximumDecimalPlaces}`;
    }
}
