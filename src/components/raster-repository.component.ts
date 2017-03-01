import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {LayerService} from '../layers/layer.service';
import {RasterLayer} from '../layers/layer.model';
import {Operator} from '../app/operators/operator.model';
import {ResultTypes} from '../app/operators/result-type.model';
import {DataType, DataTypes} from '../app/operators/datatype.model';
import {MappingSource, MappingSourceChannel} from '../models/mapping-source.model';
import {Projections} from '../app/operators/projection.model';
import {Unit} from '../app/operators/unit.model';
import {MappingColorizerRasterSymbology} from '../symbology/symbology.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {UserService} from '../users/user.service';
import {RasterSourceType} from '../app/operators/types/raster-source-type.model';
import {ProjectService} from '../project/project.service';

@Component({
    selector: 'wave-raster-repository',
    template: `
    <div style="height:100%" layout="column">
        <md-toolbar>
              <label>Raster </label>
              <span class="toolbar-fill-remaining-space"></span>
              <md-icon>search</md-icon>
              <md-input-container>
                <input mdInput placeholder="Layer" type="text" [(ngModel)]="_searchTerm">
              </md-input-container>
        </md-toolbar>
    <div flex="grow">
      <md-list>
        <template
            ngFor let-source
            [ngForOf]="sources | async | waveMappingDataSourceFilter:_searchTerm"
        >
          <h3 md-subheader class="datagroup">
            <a [href]="source?.uri" bind-innerHtml = "source.name | waveHighlightPipe:_searchTerm"></a>
          </h3>
          <template ngFor let-channel [ngForOf]="source.channels">            
              <md-list-item>
                <template [ngIf]="channel.isSwitchable">
                      <md-slide-toggle #t
                                [checked]="channel.hasTransform"
                                aria-label="transform raw data"
                                [disabled]="!channel.hasTransform">
                      </md-slide-toggle>
                      <div (click)="add(source, channel, t.checked)">
                          <p md-line bind-innerHtml = "channel.name | waveHighlightPipe:_searchTerm"></p>
                          <template [ngIf]="t.checked">
                              <p md-line >measurement: {{channel?.transform?.unit?.measurement}}</p>
                              <p md-line >unit: {{channel?.transform?.unit?.unit}}</p>
                          </template>
                          <template [ngIf]="!t.checked">
                              <p md-line >measurement: {{channel?.unit?.measurement}}</p>
                              <p md-line >unit: {{channel?.unit?.unit}}</p>
                          </template>
                      </div>
                  </template>
                  <template [ngIf]="!channel.isSwitchable">
                        <div (click)="add(source, channel, channel.hasTransform)">
                            <p md-line  bind-innerHtml = "channel.name | waveHighlightPipe:_searchTerm"></p>
                            <template [ngIf]="!channel.hasTransform">
                                <p md-line >measurement: {{channel?.unit?.measurement}}</p>
                                <p md-line >unit: {{channel?.unit?.unit}}</p>
                            </template>
                            <template [ngIf]="channel.hasTransform">
                                <p md-line >measurement: {{channel?.transform?.unit?.measurement}}</p>
                                <p md-line >unit: {{channel?.transform?.unit?.unit}}</p>
                            </template>
                        </div>
                    </template>
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

    md-list-item {
        cursor: pointer;
    }

    img {
      padding: 5px 5px 5px 0px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);
    }
}
