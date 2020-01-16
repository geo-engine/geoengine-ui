import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingColorizerRasterSymbology, RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Interpolation, Unit} from '../../unit.model';
import {Operator} from '../../operator.model';
import {NotificationService} from '../../../notification.service';
import {DataType, DataTypes} from '../../datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {RgbaCompositeType} from '../../types/rgba-composite-type.model';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-create-rgb-composite',
    templateUrl: './create-rgb-composite.component.html',
    styleUrls: ['./create-rgb-composite.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRgbCompositeComponent implements OnInit, OnDestroy {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly numberOfRasters = 3;

    form: FormGroup;

    private inputLayersubscriptions: Subscription;

    constructor(private projectService: ProjectService,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = new FormGroup({
            'inputLayers': new FormControl(
                undefined,
                [Validators.required, Validators.minLength(this.numberOfRasters), Validators.maxLength(this.numberOfRasters)],
            ),
            'redMin': new FormControl(undefined, [Validators.required]),
            'redMax': new FormControl(undefined, [Validators.required]),
            'redScale': new FormControl(1, [Validators.required, Validators.min(0), Validators.max(1)]),
            'greenMin': new FormControl(undefined, [Validators.required]),
            'greenMax': new FormControl(undefined, [Validators.required]),
            'greenScale': new FormControl(1, [Validators.required, Validators.min(0), Validators.max(1)]),
            'blueMin': new FormControl(undefined, [Validators.required]),
            'blueMax': new FormControl(undefined, [Validators.required]),
            'blueScale': new FormControl(1, [Validators.required, Validators.min(0), Validators.max(1)]),
        });

        this.inputLayersubscriptions = this.form.controls['inputLayers'].valueChanges
            .subscribe((inputLayers: Array<RasterLayer<RasterSymbology>>) => { // set meaningful default values if possible
                const colors = ['red', 'green', 'blue'];
                inputLayers.forEach((inputRaster, i) => {
                    if (inputRaster && !this.form.controls[`${colors[i]}Min`].value) {
                        this.form.controls[`${colors[i]}Min`].setValue(inputLayers[i].operator.getDataType('value').getMin());
                    }
                    if (inputRaster && !this.form.controls[`${colors[i]}Max`].value) {
                        this.form.controls[`${colors[i]}Max`].setValue(inputLayers[i].operator.getDataType('value').getMax());
                    }
                });
            });
    }

    ngOnDestroy() {
        if (this.inputLayersubscriptions) {
            this.inputLayersubscriptions.unsubscribe();
        }
    }

    add() {
        const inputs: Array<RasterLayer<RasterSymbology>> = this.form.controls['inputLayers'].value;
        const operators = inputs.map(layer => layer.operator);

        if (inputs.length !== 3) {
            this.notificationService.error('RGBA calculation requires 3 inputs.');
            return;
        }
        if (unequalProjections(operators)) {
            this.notificationService.error('Input rasters must be of same projection.');
            return;
        }

        const unit = new Unit({
            interpolation: Interpolation.Unknown,
            measurement: 'unknown',
            unit: 'unknown',
            min: 1,
            max: 0xffffffff,
        });

        this.projectService.addLayer(new RasterLayer({
            name: `RGB of (${inputs.map(layer => layer.name).join(', ')})`,
            operator: new Operator({
                operatorType: new RgbaCompositeType({
                    rasterRedMin: this.form.controls['redMin'].value,
                    rasterRedMax: this.form.controls['redMax'].value,
                    rasterRedScale: this.form.controls['redScale'].value,
                    rasterGreenMin: this.form.controls['greenMin'].value,
                    rasterGreenMax: this.form.controls['greenMax'].value,
                    rasterGreenScale: this.form.controls['greenScale'].value,
                    rasterBlueMin: this.form.controls['blueMin'].value,
                    rasterBlueMax: this.form.controls['blueMax'].value,
                    rasterBlueScale: this.form.controls['blueScale'].value,
                }),
                projection: operators[0].projection,
                rasterSources: operators,
                resultType: ResultTypes.RASTER,
                attributes: ['value'],
                dataTypes: new Map<string, DataType>().set('value', DataTypes.UInt32),
                units: new Map<string, Unit>().set('value', unit),
            }),
            symbology: new MappingColorizerRasterSymbology({
                unit,
                colorizer: new ColorizerData({
                    breakpoints: [
                        new ColorBreakpoint({rgba: {r: 0, g: 0, b: 0, a: 0}, value: 0}),
                        new ColorBreakpoint({rgba: {r: 255, g: 255, b: 255, a: 255}, value: 0xffffffff}),
                    ],
                    type: 'rgba_composite',
                }),
            }),
        }));
    }
}

function unequalProjections(operators: Operator[]) {
    const projection = operators[0].projection;
    for (const operator of operators) {
        if (projection !== operator.projection) {
            return true;
        }
    }
    return false;
}
