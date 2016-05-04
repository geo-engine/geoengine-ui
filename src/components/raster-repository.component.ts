import {Component, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {LayerService} from "../services/layer.service";
import {Layer} from "../models/layer.model";
import {Operator, ResultType} from "../models/operator.model";
import {DataType, DataTypes} from "../models/datatype.model";
import {MappingDataSourcesService} from "../services/mapping-data-sources.service";
import {MappingSource, MappingSourceChannel} from "../models/mapping-source.model";
import {MappingDataSourceFilter} from "../pipes/mapping-data-sources.pipe";
import {HighlightPipe} from "../pipes/highlight.pipe";
import {Projections} from "../models/projection.model";
import {Unit, Interpolation, UnitConfig} from "../models/unit.model";
import {MappingColorizerRasterSymbology, RasterSymbology} from "../models/symbology.model";
import {MappingColorizerService} from "../services/mapping-colorizer.service";


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
        <template ngFor #source [ngForOf]="sources | mappingDataSourceFilter:search_term" #i="index">
          <md-subheader><span [innerHtml] = "source.name | highlightPipe:search_term"></span></md-subheader>
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
    providers: [MappingDataSourcesService, MappingColorizerService],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [MappingDataSourceFilter, HighlightPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})

export class RasterRepositoryComponent {

  private sources: Array<MappingSource> = [];
  private search_term: String = "";
  constructor(private _mappingDataSourcesService: MappingDataSourcesService,
              private _mappingColorizerService: MappingColorizerService,
              private _layerService: LayerService) {
    _mappingDataSourcesService.getSources().subscribe(x => this.sources = x);
  }

  private add(source: MappingSource, channel: MappingSourceChannel, doTransform: boolean) {
    let dataType = channel.datatype;
    let unit: Unit = channel.unit;

    if (doTransform && channel.hasTransform) {
      unit = channel.transform.unit;
      dataType = channel.transform.datatype;
    }

    let op = new Operator({
        operatorType: "source",
        resultType: ResultType.RASTER,
        parameters: new Map<string, string | number | boolean>()
                        .set("channel", channel.id)
                        .set("sourcename", source.source)
                        .set("colorizer", channel.colorizer || source.colorizer || "gray")
                        .set("transform", doTransform), // FIXME user selectable transform?
        projection: Projections.fromEPSGCode("EPSG:" + source.coords.epsg),
        attributes: ["value"],
        dataTypes: new Map<string, DataType>().set(
            "value", DataTypes.fromCode(dataType)
        ),
        units: new Map<string, Unit>().set("value", unit)
    });

    this._mappingColorizerService.getColorizer(op).then(x => { // TODO: move to layer?
        let layer = new Layer({
            name: channel.name,
            operator: op,
            symbology: new MappingColorizerRasterSymbology(x),
        });
        this._layerService.addLayer(layer);
    }).catch(ex => {
        console.log("_mappingColorizerService.getColorizer", ex);
        let layer = new Layer({
            name: channel.name,
            operator: op,
            symbology: new RasterSymbology({}),
        }); // TODO: get info from server?
        this._layerService.addLayer(layer);
    });
  }
}
