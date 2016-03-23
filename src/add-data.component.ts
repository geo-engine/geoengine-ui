import {Component, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {LayerService} from "./services/layer.service";
import {Layer} from "./layer.model";
import {Operator, ResultType} from "./operator.model";
import {MappingDataSourcesService} from "./services/mapping-data-sources.service";
import {MappingSource, MappingSourceChannel} from "./mapping-source.model";
import {MappingDataSourceFilter} from "./pipes/mapping-data-sources.pipe";


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
          <md-subheader class="md-primary">{{source.name}}</md-subheader>
          <md-list-item class="md-2-line" style="cursor: pointer;"
                        *ngFor="#channel of source.channels" (click)="add(source, channel)">

            <div class="md-list-item-text" layout="column">
              <p>{{channel.name}}</p>
              <p>{{channel.datatype}}</p>
            </div>
          </md-list-item>
          <md-divider></md-divider>
        </template>
      </md-list>
    </md-content>
    </div>
    `,
    styles: [`
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
    pipes: [MappingDataSourceFilter],
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
      "EPSG:" + source.coords.epsg,
      channel.name);
    let layer = new Layer(op);
    this._layerService.addLayer(layer);
  }

}
