import {Component, ChangeDetectionStrategy} from '@angular/core';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';

import {VectorLayer} from '../../layers/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {PointInPolygonFilterType} from '../types/point-in-polygon-filter-type.model';
import {
    SimplePointSymbology, ClusteredPointSymbology, AbstractVectorSymbology,
} from '../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MdDialogRef} from '@angular/material';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    template: `
    <wave-dialog-header>Point in Polygon Filter</wave-dialog-header>
    <form [formGroup]="form" (ngSubmit)="add($event)">
        <md-dialog-content>
            <wave-multi-layer-selection
                [types]="[ResultTypes.POINTS]"
                [min]="1" [max]="1"
                formControlName="pointLayers">
            </wave-multi-layer-selection>
            <wave-multi-layer-selection
                [types]="[ResultTypes.POLYGONS]"
                [min]="1" [max]="1"
                formControlName="polygonLayers">
            </wave-multi-layer-selection>
            <wave-operator-output-name formControlName="name"></wave-operator-output-name>
        </md-dialog-content>
        <md-dialog-actions align="end">
            <button
                type="submit"
                md-raised-button
                color="primary"
                [disabled]="form.invalid"
            >Apply</button>
        </md-dialog-actions>
    </form>
    `,
    styleUrls: ['./point-in-polygon-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInPolygonFilterOperatorComponent {

    ResultTypes = ResultTypes;

    form: FormGroup;

    constructor(private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private layerService: LayerService,
                private formBuilder: FormBuilder,
                private dialogRef: MdDialogRef<PointInPolygonFilterOperatorComponent>) {
        this.form = formBuilder.group({
            name: ['Filtered Values', Validators.required],
            pointLayers: [undefined, Validators.compose([
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(1)
            ])],
            polygonLayers: [undefined, Validators.compose([
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(1)
            ])],
        });

    }

    add(event: Event) {
        event.preventDefault(); // prevent page reload on error

        if (this.form.invalid) {
            return;
        }

        const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayers'].value[0];
        const pointOperator: Operator = pointLayer.operator;
        const polygonOperator: Operator = this.form.controls['polygonLayers'].value[0].operator;

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

        this.dialogRef.close();
    }

}
