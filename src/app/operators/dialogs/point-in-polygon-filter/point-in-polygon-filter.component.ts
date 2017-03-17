import {Component, ChangeDetectionStrategy} from '@angular/core';

import {LayerService} from '../../../layers/layer.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';

import {VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {PointInPolygonFilterType} from '../../types/point-in-polygon-filter-type.model';
import {
    SimplePointSymbology, ClusteredPointSymbology, AbstractVectorSymbology,
} from '../../../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    templateUrl: 'point-in-polygon-filter.component.html',
    styleUrls: ['point-in-polygon-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInPolygonFilterOperatorComponent {

    ResultTypes = ResultTypes;

    form: FormGroup;

    constructor(private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private layerService: LayerService,
                private formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            name: ['Filtered Values', Validators.required],
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
        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: clustered ?
                new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }) :
                new SimplePointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }),
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator, clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered: clustered,
        }));

    }

}
