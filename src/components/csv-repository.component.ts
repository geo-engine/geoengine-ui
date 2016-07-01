import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../layers/layer.service';
import {VectorLayer} from '../layers/layer.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType} from '../operators/datatype.model';
import {Csv} from '../models/csv.model';
import {CsvSourceType} from '../operators/types/csv-source-type.model';
import {
    AbstractVectorSymbology, SimplePointSymbology, SimpleVectorSymbology,
} from '../symbology/symbology.model';
import {Projections} from '../operators/projection.model';
import {Unit} from '../operators/unit.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {UserService} from '../users/user.service';
import {ProjectService} from '../project/project.service';
import {RandomColorService} from '../services/random-color.service';

@Component({
    selector: 'wave-csv-repository',
    template: `
    <div style="height:100%" layout="column">
    <md-content flex="grow">
      <md-list>

            <template ngFor let-csv [ngForOf]="csvs | async" >
                <md-list-item md-clickable class="md-2-line">
                  <div class="md-list-item-text"
                    layout="column"
                    (click)="add(csv)">
                    <p>{{csv.name}}</p>
                    <p>{{csv.params.filename}}</p>
                  </div>
              </md-list-item>
              <md-divider></md-divider>
          </template>
      </md-list>
    </md-content>
    </div>
    `,
    styles: [`
    .searchInput {
        width: 100%;
    }
    md-list-item {
        cursor: pointer;
    }
    md-list >>> md-subheader {
        color: white;
        background-color: #009688;
        font-weight: bold;
    }
    img {
      padding: 5px 5px 5px 0px;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CsvRepositoryComponent {

    private csvs: Observable<Array<Csv>>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private userService: UserService,
        private randomColorService: RandomColorService
    ) {
        this.csvs = this.userService.getCsvStream();
    }

    add(csv: Csv) {

        const fillRGBA = this.randomColorService.getRandomColor();
        let resultType = ResultTypes.POINTS;
        let symbology: AbstractVectorSymbology = new SimplePointSymbology({fillRGBA: fillRGBA});

        if ( csv.geometry_type && csv.geometry_type === 'lines') {
            resultType = ResultTypes.LINES;
            symbology = new SimpleVectorSymbology({
                strokeRGBA: fillRGBA,
                fillRGBA: [0, 0, 0, 0],
            });
        }
        if ( csv.geometry_type && csv.geometry_type === 'polygons') {
            resultType = ResultTypes.POLYGONS;
            symbology = new SimpleVectorSymbology({fillRGBA: fillRGBA});
        }

        const operator = new Operator({
            operatorType: new CsvSourceType({
                csvParameters: csv.params,
            }),
            resultType: resultType,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });

        const layer = new VectorLayer<AbstractVectorSymbology>({
            name: csv.name,
            operator: operator,
            symbology: symbology,
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);
    }
}
