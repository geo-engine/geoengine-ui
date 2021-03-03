import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

import {RandomColorService} from '../../../util/services/random-color.service';

import {RasterLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {AbstractRasterSymbology} from '../../../layers/symbology/symbology.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {ExpressionType} from '../../types/expression-type.model';
import {RasterizePolygonType} from '../../types/rasterize-polygon-type.model';

/**
 * This component allows composing the raster polygon clip operator.
 */
@Component({
    selector: 'wave-raster-polygon-clip',
    templateUrl: './raster-polygon-clip.component.html',
    styleUrls: ['./raster-polygon-clip.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterPolygonClipOperatorComponent implements OnInit {
    ResultTypes = ResultTypes;

    form: FormGroup;

    constructor(private randomColorService: RandomColorService, private projectService: ProjectService, private formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            name: ['Clipped Raster', [Validators.required, WaveValidators.notOnlyWhitespace]],
            rasterLayer: [undefined, Validators.required],
            polygonLayer: [undefined, Validators.required],
        });
    }

    ngOnInit(): void {
        setTimeout(() => this.form.updateValueAndValidity({emitEvent: true}));
    }

    add() {
        if (this.form.invalid) {
            return;
        }

        const rasterLayer: RasterLayer<AbstractRasterSymbology> = this.form.controls['rasterLayer'].value;
        const rasterOperator: Operator = rasterLayer.operator;
        const polygonOperator: Operator = this.form.controls['polygonLayer'].value.operator;

        const name: string = this.form.controls['name'].value;

        const rasterizePolygonOperator = new Operator({
            operatorType: new RasterizePolygonType({}),
            resultType: ResultTypes.RASTER,
            projection: rasterOperator.projection,
            attributes: rasterOperator.attributes,
            dataTypes: rasterOperator.dataTypes,
            units: rasterOperator.units,
            polygonSources: [polygonOperator],
        });

        const expressionOperator = new Operator({
            operatorType: new ExpressionType({
                expression: `B > 0 ? A : NAN`,
                datatype: rasterOperator.getDataType('value'),
                unit: rasterOperator.getUnit('value'),
            }),
            resultType: ResultTypes.RASTER,
            projection: rasterOperator.projection,
            attributes: rasterOperator.attributes,
            dataTypes: rasterOperator.dataTypes,
            units: rasterOperator.units,
            rasterSources: [rasterOperator, rasterizePolygonOperator],
        });

        const layer = new RasterLayer({
            name,
            operator: expressionOperator,
            symbology: rasterLayer.symbology,
        });

        this.projectService.addLayer(layer);
    }
}
