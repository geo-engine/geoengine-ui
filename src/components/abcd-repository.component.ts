import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../layers/layer.service';
import {VectorLayer} from '../layers/layer.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType, DataTypes} from '../operators/datatype.model';
import {AbcdArchive} from '../models/abcd.model';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../operators/types/abcd-source-type.model';
import {SimplePointSymbology, ClusteredPointSymbology} from '../symbology/symbology.model';
import {Projections} from '../operators/projection.model';
import {Unit} from '../operators/unit.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {UserService} from '../users/user.service';
import {ProjectService} from '../project/project.service';
import {RandomColorService} from '../services/random-color.service';
import {BasicColumns} from '../models/csv.model';

type Grouped<T> = Iterable<Group<T>>;

interface Group<T> {
        group: Array<T>;
        name: string;
    };

@Component({
    selector: 'wave-abcd-repository',
    template: `
    <div style='height:100%' layout='column'>
    <md-content flex='grow'>
      <md-list>
        <template
            ngFor let-group
            [ngForOf]='groups | async'
        >
            <md-subheader>
                <span>{{group.name}}</span>
            </md-subheader>
            <template ngFor let-archive [ngForOf]='group.group' >
                <md-list-item md-clickable class='md-2-line'>
                  <div class='md-list-item-text'
                    layout='column'
                    (click)='add(archive)'>
                    <p>{{archive.dataset}}<span *ngIf="!archive.available" style="color: red;"> (not available)</span></p>
                    <a class='link' target='_blank' href={{archive.link}}>{{archive.link}}</a>
                  </div>
              </md-list-item>
              <md-divider></md-divider>
          </template>
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
    .md-list-item-text {
        align-items: flex-end;
    }
    md-list >>> md-subheader {
        color: white;
        background-color: #009688;
        font-weight: bold;
    }
    img {
      padding: 5px 5px 5px 0px;
    }
    .link {
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AbcdRepositoryComponent {

    private groups: Observable<Grouped<AbcdArchive>>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private userService: UserService,
        private randomColorService: RandomColorService
    ) {
        this.groups = this.userService.getAbcdArchivesStream().map(archives => {
            let groups: {[groupname: string]: Group<AbcdArchive>} = {};

            for (let a of archives) {
                if ( !groups[a.provider] ) {
                    groups[a.provider] = {
                        group: new Array<AbcdArchive>(),
                        name: a.provider,
                    };
                }
                groups[a.provider].group.push(a);
            }

            const iterableGroups: Array<Group<AbcdArchive>> = new Array();
            const keys = Object.keys(groups).sort();
            for (let key of keys) {
                const value = groups[key];
                value.group = value.group.sort((x, y) => (x.dataset < y.dataset) ? 0 : 1);
                iterableGroups.push(value);
            }

            return iterableGroups;
        });
    }

    add(archive: AbcdArchive) {

        const basicColumns: BasicColumns = {
            numeric: [],
            textual: [],
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        this.userService.getSourceSchemaAbcd().first().subscribe(sourceSchema => {

            for (let attribute of sourceSchema) {

                if (attribute.numeric) {
                    basicColumns.numeric.push(attribute.name);
                    attributes.push(attribute.name);
                    dataTypes.set(attribute.name, DataTypes.Float64); // TODO: get more accurate type
                    units.set(attribute.name, Unit.defaultUnit);
                } else {
                    basicColumns.textual.push(attribute.name);
                    attributes.push(attribute.name);
                    dataTypes.set(attribute.name, DataTypes.Alphanumeric); // TODO: get more accurate type
                    units.set(attribute.name, Unit.defaultUnit);
                }
            }

            const sourceTypeConfig: ABCDSourceTypeConfig = {
                provider: archive.provider,
                id: archive.file,
                columns: basicColumns,
            };

            const operator = new Operator({
                operatorType: new ABCDSourceType(sourceTypeConfig),
                resultType: ResultTypes.POINTS,
                projection: Projections.WGS_84,
                attributes: attributes,
                dataTypes: dataTypes,
                units: units,
            });

            const clustered = true;
            const layer = new VectorLayer<ClusteredPointSymbology>({
                name: archive.dataset,
                operator: operator,
                symbology: new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }),
                data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    operator,
                    clustered,
                }),
                provenance: this.mappingQueryService.getProvenanceStream(operator),
                clustered: clustered,
            });
            this.layerService.addLayer(layer);
        });
    }
}
