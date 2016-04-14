import {Component, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {LayerService} from "./services/layer.service";
import {Layer} from "./models/layer.model";
import {Operator, ResultType} from "./models/operator.model";
import {MappingDataSourcesService} from "./services/mapping-data-sources.service";
import {MappingSource, MappingSourceChannel} from "./mapping-source.model";
import {MappingDataSourceFilter} from "./pipes/mapping-data-sources.pipe";
import {HighlightPipe} from "./pipes/highlight.pipe";
import {Projections} from "./models/projection.model";


@Component({
    selector: "add-data-component",
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
            <md-list-item class="md-2-line" style="cursor: pointer;" (click)="add(source, channel)">
              <div class="md-list-item-text" layout="column">
                <p bind-innerHtml = "channel.name | highlightPipe:search_term"></p>
                <p>{{channel.datatype}}</p>
              </div>
            </md-list-item>
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
    providers: [MappingDataSourcesService],
    directives: [MATERIAL_DIRECTIVES],
    pipes: [MappingDataSourceFilter, HighlightPipe],
    // changeDetection: ChangeDetectionStrategy.OnPush
})

export class AddDataComponent {

  private sources: Array<MappingSource> = [];
  private search_term: String = "";
  constructor(private _mappingDataSourcesService: MappingDataSourcesService, private _layerService: LayerService) {
    _mappingDataSourcesService.getSources().subscribe(x => this.sources = x);
  }

  private add(source: MappingSource, channel: MappingSourceChannel) {
    let op = new Operator(
      "source", ResultType.RASTER,
      new Map<string, string | number>().set("channel", channel.id).set("sourcename", source.source).set("colorizer", channel.colorizer || source.colorizer || "gray"),
      Projections.fromEPSGCode("EPSG:" + source.coords.epsg),
      channel.name);
    let layer = new Layer(op);
    this._layerService.addLayer(layer);
  }

}
