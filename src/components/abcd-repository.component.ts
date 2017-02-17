import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {LayerService} from '../layers/layer.service';
import {VectorLayer} from '../layers/layer.model';
import {Operator} from '../app/operators/operator.model';
import {ResultTypes} from '../app/operators/result-type.model';
import {DataType, DataTypes} from '../app/operators/datatype.model';
import {AbcdArchive} from '../models/abcd.model';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../app/operators/types/abcd-source-type.model';
import {SimplePointSymbology, ClusteredPointSymbology} from '../symbology/symbology.model';
import {Projections} from '../app/operators/projection.model';
import {Unit} from '../app/operators/unit.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {UserService} from '../users/user.service';
import {ProjectService} from '../project/project.service';
import {RandomColorService} from '../services/random-color.service';
import {BasicColumns} from '../models/csv.model';

type Grouped<T> = Iterable<Group<T>>;

interface Group<T> {
        group: Array<T>;
        name: string;
    }

@Component({
    selector: 'wave-abcd-repository',
    template: `
    <div style='height:100%' layout='column'>
    <div flex='grow'>
      <md-toolbar>
        <label>ABCD</label>            
        <span class="toolbar-fill-remaining-space"></span>
        <md-icon>search</md-icon>
        <md-input-container>
          <input md-input placeholder="Layer" type="text" [(ngModel)]="_searchTerm" disabled>
        </md-input-container>
      </md-toolbar>
      <md-list>
        <template ngFor let-group [ngForOf]='groups | async'>
            <h3 md-subheader class="datagroup">
              {{group.name}} <a md-icon-button target='_blank' href={{group?.uri}} *ngIf="!!group.uri"><md-icon>open_in_new</md-icon></a>
            </h3>
            <template ngFor let-archive [ngForOf]='group.group'>
                <md-list-item>
                    <a  md-icon-button
                        class="secondary_action"
                        target='_blank'
                        href={{archive.link}}
                        *ngIf="!!archive.link"
                        mdTooltip="landingpage"
                        >
                            <md-icon>open_in_new</md-icon>
                    </a>
                    <p md-line (click)='add(archive)'>
                        {{archive.dataset}}<span *ngIf="!archive.available" style="color: red;"> (not available)</span>                        
                    </p>
              </md-list-item>
              <md-divider></md-divider>
          </template>
      </template>
      </md-list>
    </div>
    </div>
    `,
    styles: [`
    .toolbar-fill-remaining-space {
        flex: 1 1 auto;
    }
    
    .datagroup {
        color: white;
        background-color: #009688;
    }
    
    .datagroup a {
        color: white;
        font-family: Roboto, "Helvetica Neue";
    }
    
    .searchInput {
        width: 100%;
    }
    md-list-item {
        cursor: pointer;
    }
    
    .secondary_action {
        float: right;
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
