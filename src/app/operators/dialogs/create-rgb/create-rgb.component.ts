import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingColorizerRasterSymbology, RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Interpolation, Unit} from '../../unit.model';
import {Operator} from '../../operator.model';
import {NotificationService} from '../../../notification.service';
import {ExpressionType} from '../../types/expression-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {ColorizerData} from '../../../colors/colorizer-data.model';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';

@Component({
    selector: 'wave-create-rgb',
    templateUrl: './create-rgb.component.html',
    styleUrls: ['./create-rgb.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRgbComponent implements OnInit {
    readonly inputTypes = [ResultTypes.RASTER];
    readonly inputMinLength = 3;
    readonly inputMaxLength = 4;

    form: FormGroup;

    constructor(private projectService: ProjectService, private notificationService: NotificationService) {
    }

    ngOnInit() {
        this.form = new FormGroup({
            'inputLayers': new FormControl(
                undefined,
                [Validators.required, Validators.minLength(this.inputMinLength), Validators.maxLength(this.inputMaxLength)],
            ),
        });
    }

    add() {
        const inputs: Array<RasterLayer<RasterSymbology>> = this.form.controls['inputLayers'].value;
        const operators = inputs.map(layer => layer.operator);

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

        let expression;
        if (inputs.length === 3) {
            expression = 'A | (B << 8) | (C << 16) | (255 << 24)';
        } else if (inputs.length === 4) {
            expression = 'A | (B << 8) | (C << 16) | (D << 24)';
        } else {
            throw new Error('RGBA calculation requires 3 or 4 inputs.');
        }

        this.projectService.addLayer(new RasterLayer({
            name: `RGB of (${inputs.map(layer => layer.name).join(', ')})`,
            operator: new Operator({
                operatorType: new ExpressionType({
                    datatype: DataTypes.UInt32,
                    expression,
                    unit,
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
                    type: 'rgba',
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
