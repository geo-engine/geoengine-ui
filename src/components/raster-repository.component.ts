import {Component} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../layers/layer.service';
import {RasterLayer} from '../layers/layer.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType, DataTypes} from '../operators/datatype.model';
import {MappingSource, MappingSourceChannel} from '../models/mapping-source.model';
import {MappingDataSourceFilter} from '../pipes/mapping-data-sources.pipe';
import {HighlightPipe} from '../pipes/highlight.pipe';
import {Projections} from '../operators/projection.model';
import {Unit} from '../operators/unit.model';
import {MappingColorizerRasterSymbology} from '../symbology/symbology.model';
import {MappingQueryService} from '../services/mapping-query.service';
import {UserService} from '../users/user.service';
import {RasterSourceType} from '../operators/types/raster-source-type.model';
import {ProjectService} from '../project/project.service';

@Component({
    selector: 'wave-raster-repository',
    template: `
    <div style="height:100%" layout="column">
    <md-input placeholder="Search term" type="text" [(ngModel)]="_searchTerm"
    ></md-input>
    <md-content flex="grow">
      <md-list>
        <template
            ngFor let-source
            [ngForOf]="sources | async | waveMappingDataSourceFilter:_searchTerm"
        >
          <md-subheader>
            <span [innerHtml] = "source.name | waveHighlightPipe:_searchTerm"></span>
          </md-subheader>

          <template ngFor let-channel [ngForOf]="source.channels">
            <md-divider></md-divider>
              <md-list-item md-clickable class="md-3-line">
                  <md-switch #t
                            [checked]="channel.hasTransform"
                            aria-label="transform raw data"
                            [disabled]="!channel.hasTransform">
                  </md-switch>
                  <div class="md-list-item-text"
                        layout="column"
                        (click)="add(source, channel, t.checked)">

                      <p bind-innerHtml = "channel.name | waveHighlightPipe:_searchTerm"></p>
                      <template [ngIf]="t.checked">
                          <p>measurement: {{channel?.transform?.unit?.measurement}}</p>
                          <p>unit: {{channel?.transform?.unit?.unit}}</p>
                      </template>
                      <template [ngIf]="!t.checked">
                          <p>measurement: {{channel?.unit?.measurement}}</p>
                          <p>unit: {{channel?.unit?.unit}}</p>
                      </template>

                  </div>
              </md-list-item>
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
    pipes: [MappingDataSourceFilter, HighlightPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})

export class RasterRepositoryComponent {

    private _searchTerm: String = '';
    private sources: Observable<Array<MappingSource>>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private userService: UserService
    ) {
        this.sources = this.userService.getRasterSourcesStream();
    }

    add(source: MappingSource, channel: MappingSourceChannel, doTransform: boolean) {
        let dataType = channel.datatype;
        let unit: Unit = channel.unit;

        if (doTransform && channel.hasTransform) {
            unit = channel.transform.unit;
            dataType = channel.transform.datatype;
        }

        const operator = new Operator({
            operatorType: new RasterSourceType({
                channel: channel.id,
                sourcename: source.source,
                transform: doTransform, // FIXME user selectable transform?
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.fromCode('EPSG:' + source.coords.epsg),
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set(
                'value', DataTypes.fromCode(dataType)
            ),
            units: new Map<string, Unit>().set('value', unit),
        });

        const layer = new RasterLayer({
            name: channel.name,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            prov$: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);
    }
}
