import {Component} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MD_ICON_DIRECTIVES} from '@angular2-material/icon';
import {MD_BUTTON_DIRECTIVES} from '@angular2-material/button';
import {MD_TOOLBAR_DIRECTIVES} from '@angular2-material/toolbar';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../layers/layer.service';
import {VectorLayer} from '../layers/layer.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType, DataTypes} from '../operators/datatype.model';
import {CsvFile} from '../models/csv.model';
import {CsvSourceType} from '../operators/types/csv-source-type.model';
import {
    AbstractVectorSymbology, SimplePointSymbology, SimpleVectorSymbology, ClusteredPointSymbology,
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
     <div style="height:100%; min-width:300px;" layout="column">
        <md-toolbar>
          <label>CSV data / upload</label>            
          <span class="toolbar-fill-remaining-space"></span>
           <button md-button aria-label='upload' disabled>
            <md-icon>cloud_upload</md-icon>
            upload
          </button>
          <button md-icon-button aria-label='sync' disabled>
            <md-icon>sync</md-icon>
          </button>
        </md-toolbar>
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

    .toolbar-fill-remaining-space {
        flex: 1 1 auto;
    }
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
    directives: [CORE_DIRECTIVES, MD_ICON_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_TOOLBAR_DIRECTIVES, MD_BUTTON_DIRECTIVES],
})

export class CsvRepositoryComponent {

    private csvs: Observable<Array<CsvFile>>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private userService: UserService,
        private randomColorService: RandomColorService
    ) {
        this.csvs = this.userService.getCsvStream();
    }

    add(csv: CsvFile) {

        const fillRGBA = this.randomColorService.getRandomColor();
        let resultType = ResultTypes.POINTS;
        let symbology: AbstractVectorSymbology = new ClusteredPointSymbology({fillRGBA: fillRGBA});
        let clustered = true;

        if ( csv.geometry_type && csv.geometry_type === 'lines') {
            resultType = ResultTypes.LINES;
            clustered = false;
            symbology = new SimpleVectorSymbology({
                strokeRGBA: fillRGBA,
                fillRGBA: [0, 0, 0, 0],
            });
        }
        if ( csv.geometry_type && csv.geometry_type === 'polygons') {
            resultType = ResultTypes.POLYGONS;
            clustered = false;
            symbology = new SimpleVectorSymbology({fillRGBA: fillRGBA});
        }

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        for (const attribute of csv.params.columns.numeric) {
            attributes.push(attribute);
            dataTypes.set(attribute, DataTypes.Float64); // TODO: get more accurate type
            units.set(attribute, Unit.defaultUnit);
        }

        for (const attribute of csv.params.columns.textual) {
            attributes.push(attribute);
            dataTypes.set(attribute, DataTypes.Alphanumeric);
            units.set(attribute, Unit.defaultUnit);
        }

        const operator = new Operator({
            operatorType: new CsvSourceType({
                csvParameters: csv.params,
                filename: csv.filename,
            }),
            resultType: resultType,
            projection: Projections.WGS_84,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        });

        const layer = new VectorLayer<AbstractVectorSymbology>({
            name: csv.name,
            operator: operator,
            symbology: symbology,
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator,
                clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered: clustered,
        });
        this.layerService.addLayer(layer);
    }
}
