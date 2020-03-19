import {Component, ChangeDetectionStrategy} from '@angular/core';

import {RandomColorService} from '../../../util/services/random-color.service';

import {VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {PointInPolygonFilterType} from '../../types/point-in-polygon-filter-type.model';
import {
    AbstractVectorSymbology, PointSymbology,
} from '../../../layers/symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    templateUrl: './point-in-polygon-filter.component.html',
    styleUrls: ['./point-in-polygon-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInPolygonFilterOperatorComponent {

    ResultTypes = ResultTypes;

    form: FormGroup;

    constructor(private randomColorService: RandomColorService,
                private projectService: ProjectService,
                private formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            name: ['Filtered Values', [Validators.required, WaveValidators.notOnlyWhitespace]],
            pointLayer: [undefined, Validators.required],
            polygonLayer: [undefined, Validators.required],
        });

    }

    add(event: Event) {
        event.preventDefault(); // prevent page reload on error

        if (this.form.invalid) {
            return;
        }

        // const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayers'].value[0];
        const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayer'].value;
        const pointOperator: Operator = pointLayer.operator;
        const polygonOperator: Operator = this.form.controls['polygonLayer'].value.operator;

        const name: string = this.form.controls['name'].value;

        const operator = new Operator({
            operatorType: new PointInPolygonFilterType({}),
            resultType: ResultTypes.POINTS,
            projection: pointOperator.projection,
            attributes: pointOperator.attributes,
            dataTypes: pointOperator.dataTypes,
            units: pointOperator.units,
            pointSources: [pointOperator],
            polygonSources: [polygonOperator],
        });

        const clustered = pointLayer.clustered;
        const layer = new VectorLayer({
            name,
            operator,
            symbology: clustered ?
                PointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                }) :
                PointSymbology.createSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                }),
            // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
            //     operator, clustered,
            // }),
            // provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered,
        });
        // this.layerService.addLayer(layer);
        this.projectService.addLayer(layer);

    }

}
