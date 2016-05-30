import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {
    OperatorBaseComponent, LayerMultiSelectComponent, OperatorOutputNameComponent,
} from './operator.component';

import {LayerService} from '../../services/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../services/mapping-query.service';
import {ProjectService} from '../../services/project.service';

import {VectorLayer} from '../../models/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {PointInPolygonFilterType} from '../types/point-in-polygon-filter-type.model';
import {SimplePointSymbology, AbstractVectorSymbology} from '../../symbology/symbology.model';

/**
 * This component allows creating the point in polygon filter operator.
 */
@Component({
    selector: 'wave-point-in-polygon-filter',
    template: `
    <form [ngFormModel]="configForm">
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="1"
            [types]="[ResultTypes.POINTS]"
            (selectedLayers)="pointLayer = $event[0]">
        </wave-multi-layer-selection>
        <wave-multi-layer-selection
            [layers]="layers" [min]="1" [max]="1"
            [types]="[ResultTypes.POLYGONS]"
            (selectedLayers)="polygonLayer = $event[0]">
        </wave-multi-layer-selection>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        LayerMultiSelectComponent, OperatorOutputNameComponent,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class PointInPolygonFilterOperatorComponent extends OperatorBaseComponent
                                                   implements OnInit {

        private configForm: ControlGroup;
        private pointLayer: VectorLayer<AbstractVectorSymbology>;
        private polygonLayer: VectorLayer<AbstractVectorSymbology>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

        this.configForm = formBuilder.group({
            name: ['Filtered Values', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('Point in Polygon Filter');
    }

    add() {
        const pointOperator = this.pointLayer.operator;
        const polygonOperator = this.polygonLayer.operator;

        const name: string = this.configForm.controls['name'].value;

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

        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({
                fill_rgba: this.randomColorService.getRandomColor(),
            }),
            data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
            prov$: this.mappingQueryService.getProvenanceStream(operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            ),
        }));

        this.dialog.close();
    }

}
