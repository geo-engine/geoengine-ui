import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef,
        OnInit, AfterViewInit, ElementRef} from "angular2/core";
import {Http, HTTP_PROVIDERS} from "angular2/http";
import {BehaviorSubject, Observable} from "rxjs/Rx";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import Config from "./config.model";
import {LayerService} from "./services/layer.service";
import {ResultType} from "./models/operator.model";
import {ProjectService} from "./services/project.service";


interface Column {
    name: string;
}

@Component({
    selector: "wv-data-table",
    template: `
      <md-data-table layout-fill>
      <thead>
      <tr>
        <th *ngFor="#column of columns">{{column.name}}</th>
      </tr>
      </thead>
      <tbody>
      <template ngFor #row [ngForOf]="rows">
        <tr>
          <td *ngFor="#entry of row">{{ entry }}</td>
        </tr>
      </template>
      </tbody>
    </md-data-table>
    `,


    // template: `
    // <div *ngFor="#item of data">{{item}}</div>
    // `,
    // template: `
    //     <vaadin-grid
    //         [columns]="columns"
    //         [items]="data"
    //         [style.height.px]="height">
    //     </vaadin-grid>
    // `,
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable implements OnInit {
    @Input()
    private height: number;

    private rows: Array<Array<string>> = [];
    private columns: Array<Column> = [];
    private data$: Observable<Array<Array<string>>>;

    constructor(private http: Http,
                private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService,
                private projectService: ProjectService) {

                this.data$ = this.layerService.getSelectedLayerStream().map(layer => {
                      if (layer === undefined) {
                        return Observable.of([]);
                      }
                          switch (layer.resultType) {
                              case ResultType.POINTS:
                                let layerParams = layer.getParams(this.projectService.getProjectOnce().workingProjection);
                                  return this.http.get(Config.MAPPING_URL + "?" + Object.keys(layerParams).map(key => key + "=" + encodeURIComponent(layerParams[key])).join("&") + "&format=csv").map(result => {

                                        const csv_rows = result.text().split("\n"); // split by new lines to seperate the rows
                                        let data_rows: Array<Array<string>> = [];
                                        for (let csv_row of csv_rows){
                                          data_rows.push(csv_row.split(","));
                                        }
                                        return data_rows;
                                      });
                                default:
                                    return Observable.of([]);
                                };
                          }).concatAll();
    }

    ngOnInit() {
      this.data$.subscribe( (data_rows: Array<Array<string>>) => {
        if (data_rows.length > 0) {
          const [car, ...cdr] = data_rows;
          this.columns = car.map(name => ({ name })); // take the first row (HEADER) and put them into new objects with name attribute = interface Column. TODO: get type?
          this.rows = cdr;
        }
        else {
          this.rows = [];
          this.columns = [];
        }
        this.changeDetectorRef.markForCheck();
      });
    }

}
