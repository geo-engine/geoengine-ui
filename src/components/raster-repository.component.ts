import {Component, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {LayerService} from "../services/layer.service";
import {RasterLayer} from "../models/layer.model";
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType, DataTypes} from '../operators/datatype.model';
import {MappingDataSourcesService} from "../services/mapping-data-sources.service";
import {MappingSource, MappingSourceChannel} from "../models/mapping-source.model";
import {MappingDataSourceFilter} from "../pipes/mapping-data-sources.pipe";
import {HighlightPipe} from "../pipes/highlight.pipe";
import {Projections} from '../operators/projection.model';
import {Unit, Interpolation, UnitConfig} from '../operators/unit.model';
import {MappingColorizerRasterSymbology, RasterSymbology} from "../symbology/symbology.model";
import {MappingQueryService} from "../services/mapping-query.service";
import {RasterSourceType} from '../operators/types/raster-source-type.model';
import {ProjectService} from '../services/project.service';


@Component({
    selector: "raster-repository-component",
    template: `
    <div style="height:100%" layout="column">
    <md-input-container class="md-block" style="margin-bottom: 0px; padding-bottom: 0px;">
      <label>Search term</label>
      <input md-input (valueChange)="search_term = $event">
    </md-input-container>

    <md-content flex="grow">
      <md-list>
        <template ngFor #source [ngForOf]="sources | waveMappingDataSourceFilter:search_term">
          <md-subheader>
            <span [innerHtml] = "source.name | highlightPipe:search_term"></span>
          </md-subheader>
          <template ngFor #channel [ngForOf]="source.channels">
            <md-divider></md-divider>
            <md-list-item *ngIf="!channel.hasTransform" class="md-3-line" style="cursor: pointer;" (click)="add(source, channel, channel.hasTransform)">
            <div class="md-list-item-text" layout="column">
              <p bind-innerHtml = "channel.name | highlightPipe:search_term"></p>
              <p>measurement: {{channel?.unit?.measurement}}</p>
              <p>unit: {{channel?.unit?.unit}}</p>
            </div>
          </md-list-item>
          <template [ngIf]="channel.hasTransform">
            <md-list-item  class="md-3-line" style="cursor: pointer;" (click)="add(source, channel, channel.hasTransform)">
              <div class="md-list-item-text" layout="column">
                <p bind-innerHtml = "channel.name | highlightPipe:search_term"></p>
                <p>measurement: {{channel?.transform?.unit?.measurement}}</p>
                <p>unit: {{channel?.transform?.unit?.unit}}</p>
                </div>
            </md-list-item>
            <md-divider md-inset></md-divider>
            <md-list-item  class="md-2-line" style="cursor: pointer;" (click)="add(source, channel, !channel.hasTransform)">
              <div class="md-list-item-text" layout="column">
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
    providers: [MappingDataSourcesService, MappingQueryService],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [MappingDataSourceFilter, HighlightPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})

export class RasterRepositoryComponent {

  private sources: Array<MappingSource> = [];
  private search_term: String = '';
  constructor(private mappingDataSourcesService: MappingDataSourcesService,
              private mappingQueryService: MappingQueryService,
              private layerService: LayerService,
              private projectService: ProjectService) {
    mappingDataSourcesService.getSources().subscribe(x => this.sources = x);
  }

  private add(source: MappingSource, channel: MappingSourceChannel, doTransform: boolean) {
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
        symbology: new MappingColorizerRasterSymbology({}, this.mappingQueryService.getColorizerStream(operator,
                this.projectService.getTimeStream(),
                this.projectService.getMapProjectionStream()
            )
        ),
    });
    this.layerService.addLayer(layer);
  }
}
