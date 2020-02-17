import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ResultTypes} from '../../result-type.model';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ProjectService} from '../../../project/project.service';
import {RasterLayer} from '../../../layers/layer.model';
import {RasterSymbology} from '../../../layers/symbology/symbology.model';
import {Operator} from '../../operator.model';
import {ExpressionType} from '../../types/expression-type.model';

@Component({
    selector: 'wave-raster-mask',
    templateUrl: './raster-mask.component.html',
    styleUrls: ['./raster-mask.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RasterMaskComponent {

    readonly RASTER_TYPE = [ResultTypes.RASTER];

    form: FormGroup;
    formIsInvalid$: Observable<boolean>;

    constructor(private projectService: ProjectService) {
        this.form = new FormGroup({
            'input': new FormControl(undefined, [Validators.required]),
            'mask': new FormControl(undefined, [Validators.required]),
            'name': new FormControl('Masked Layer', [Validators.required]),
        });

        this.formIsInvalid$ = this.form.statusChanges.pipe(map(status => status !== 'VALID'));

        setTimeout(() => { // calculate validity to enforce invalid state upfront
            this.form.updateValueAndValidity();
        });
    }

    add() {
        const inputLayer: RasterLayer<RasterSymbology> = this.form.controls.input.value;
        const maskLayer: RasterLayer<RasterSymbology> = this.form.controls.mask.value;
        const name = this.form.controls.name.value as string;

        this.projectService.addLayer(new RasterLayer({
            name,
            operator: new Operator({
                attributes: inputLayer.operator.attributes,
                dataTypes: inputLayer.operator.dataTypes,
                operatorType: new ExpressionType({
                    datatype: inputLayer.operator.dataTypes.get('value'),
                    expression: 'B != 0 ? A : out_info->no_data',
                    unit: inputLayer.operator.units.get('value'),
                }),
                projection: inputLayer.operator.projection,
                rasterSources: [
                    inputLayer.operator,
                    maskLayer.operator,
                ],
                resultType: inputLayer.operator.resultType,
                units: inputLayer.operator.units
            }),
            symbology: inputLayer.symbology,
        }));
    }
}
