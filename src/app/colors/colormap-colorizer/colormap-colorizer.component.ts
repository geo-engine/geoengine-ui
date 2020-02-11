import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges
} from '@angular/core';
import {ColorizerData} from '../colorizer-data.model';
import {ColorMapStepScale, MplColormap, MplColormapName} from '../mpl-colormaps/mpl-colormap.model';

@Component({
    selector: 'wave-colormap-colorizer',
    templateUrl: 'colormap-colorizer.component.html',
    styleUrls: ['colormap-colorizer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColormapColorizerComponent implements OnChanges {

    @Output() colormapColorizerData = new EventEmitter<ColorizerData>();
    @Input() colormapNames: Array<MplColormapName> = ['VIRIDIS', 'MAGMA' , 'INFERNO' , 'PLASMA'];
    @Input() colormapStepScales: Array<ColorMapStepScale> = ['linear', 'exponential_steps', 'exponential_values', 'log_steps', 'log_values',
        'log_values_inverse', 'exponential_values_inverse'];
    @Input() defaultNumberOfSteps = 16;
    @Input() maxColormapSteps = 16;
    @Input() valueRangeMin: number;
    @Input() valueRangeMax: number;

    private selectedColormapName: MplColormapName = this.colormapNames[0];
    private selectedColormapStepScales: ColorMapStepScale = this.colormapStepScales[0];
    private selectedColormapSteps: number = this.defaultNumberOfSteps;

    constructor(private changeDetectorRef: ChangeDetectorRef) {

    }

    updateColormapNames() {
        if (!this.selectedColormapName || this.colormapNames.findIndex( x => x === this.selectedColormapName ) < 0) {
            this.selectedColormapName = this.colormapNames[0];
        }
    }

    updateColormapStepScales() {
        if (
            !this.selectedColormapStepScales
            || this.colormapStepScales.findIndex( x => x === this.selectedColormapStepScales) < 0
        ) {
            this.selectedColormapStepScales = this.colormapStepScales[0];
        }
    }

    updateColormapMaxSteps() {
        if (
            !this.selectedColormapSteps
            || this.selectedColormapSteps < 2
            || this.selectedColormapSteps > this.maxColormapSteps
        ) {
            this.selectedColormapSteps = this.defaultNumberOfSteps;
        }
    }

    generateAndApplyNewColorTable() {
        if (this.valueRangeMin >= this.valueRangeMax) {
            return;
        }

        const colorizerData = MplColormap.creatColorizerDataWithName(
            this.selectedColormapName, this.valueRangeMin, this.valueRangeMax, this.selectedColormapSteps, this.selectedColormapStepScales
        );
        this.colormapColorizerData.emit(colorizerData);
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'colormapNames':
                    this.updateColormapNames();
                    break;
                case 'colormapStepScales':
                    this.updateColormapStepScales();
                    break;
                case 'maxColormapSteps':
                    this.updateColormapMaxSteps();
                    break;
                case 'defaultNumberOfSteps': {
                    this.updateColormapMaxSteps();
                    break;
                }
                case 'valueRangeMin':
                case 'valueRangeMax': {

                    break;
                }
                default: {// DO NOTHING
                }

            }
        }
    }
}
