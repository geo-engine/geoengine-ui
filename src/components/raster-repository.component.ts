import {Component, OnDestroy} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {Subscription} from 'rxjs/Rx';

import {LayerService} from '../services/layer.service';
import {RasterLayer} from '../models/layer.model';
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
import {RasterSourceType} from '../operators/types/raster-source-type.model';
import {ProjectService} from '../services/project.service';

@Component({
    selector: 'wave-raster-repository',
    template: `
    <div style='height:100%' layout='column'>
    <md-input-container class='md-block' style='margin-bottom: 0px; padding-bottom: 0px;'>
      <label>Search term</label>
      <input md-input (valueChange)='_searchTerm = $event'>
    </md-input-container>

    <md-content flex='grow'>
      <md-list>
        <template ngFor let-source [ngForOf]='sources | waveMappingDataSourceFilter:_searchTerm'>
          <md-subheader>
            <span [innerHtml] = 'source.name | highlightPipe:_searchTerm'></span>
          </md-subheader>

          <template ngFor let-channel [ngForOf]='source.channels'>
            <md-divider></md-divider>
            <md-list-item   *ngIf='!channel.hasTransform'
                            class='md-3-line'
                            style='cursor: pointer;'
                            (click)='add(source, channel, channel.hasTransform)'>

                <div class='md-list-item-text' layout='column'>
                  <p bind-innerHtml = 'channel.name | highlightPipe:_searchTerm'></p>
                  <p>measurement: {{channel?.unit?.measurement}}</p>
                  <p>unit: {{channel?.unit?.unit}}</p>
                </div>
            </md-list-item>

          <template [ngIf]='channel.hasTransform'>
            <md-list-item   class='md-3-line'
                            style='cursor: pointer;'
                            (click)='add(source, channel, channel.hasTransform)'>

                <div class='md-list-item-text' layout='column'>
                    <p bind-innerHtml = 'channel.name | highlightPipe:_searchTerm'></p>
                    <p>measurement: {{channel?.transform?.unit?.measurement}}</p>
                    <p>unit: {{channel?.transform?.unit?.unit}}</p>
                </div>
            </md-list-item>
            <md-divider md-inset></md-divider>
            <md-list-item   class='md-2-line'
                            style='cursor: pointer;'
                            (click)='add(source, channel, !channel.hasTransform)'>

                <div class='md-list-item-text' layout='column'>
                    <p>measurement: {{channel?.unit?.measurement}}</p>
                    <p>unit: {{channel?.unit?.unit}}</p>
                </div>
            </md-list-item>
            </template>

          </template>

      </template>
      </md-list>
    </md-content>
    </div>
    `,
    styles: [`
    md-subheader {
      color:#ffffff;
      background-color:#3f51b5;
      font-weight: bold;
    }
    md-list-item {
      cursor: pointer;
    }
    md-list-item:hover {
      background-color: #f5f5f5;
    }
    img {
      padding: 5px 5px 5px 0px;
    }
    `],
    providers: [MappingQueryService],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [MappingDataSourceFilter, HighlightPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})

export class RasterRepositoryComponent implements OnDestroy {

  private sources: Array<MappingSource> = [];
  private _searchTerm: String = '';
  private rasterSourcesSubscription: Subscription;

  constructor(private mappingQueryService: MappingQueryService,
              private layerService: LayerService,
              private projectService: ProjectService) {
                  this.rasterSourcesSubscription = mappingQueryService.getRasterSourcesStream()
                    .subscribe(x => this.sources = x);
  }

  add(source: MappingSource, channel: MappingSourceChannel, doTransform: boolean) {
    let dataType = channel.datatype;
    let unit: Unit = channel.unit;

    if (doTransform && channel.hasTransform) {
      unit = channel.transform.unit;
      dataType = channel.transform.datatype;
    }

    let operator = new Operator({
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

    let layer = new RasterLayer({
        name: channel.name,
        operator: operator,
        symbology: new MappingColorizerRasterSymbology({},
            this.mappingQueryService.getColorizerStream(operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            )
        ),
    });
    this.layerService.addLayer(layer);
  }

  ngOnDestroy() {
      if (this.rasterSourcesSubscription) {
          this.rasterSourcesSubscription.unsubscribe();
      }
  }
}
