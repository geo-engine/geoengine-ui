import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef,
        OnInit, AfterViewInit, ElementRef, OnChanges, SimpleChange} from "angular2/core";
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
    <md-content class="container" [style.height.px]="height" (scroll)="onScroll($event)">
      <md-data-table>
        <thead>
          <tr [style.height.px]="scrollTop"></tr>
          <tr>
            <th *ngFor="#column of columns">{{column.name}} </th>
          </tr>
        </thead>
        <tbody>
          <template ngFor #row [ngForOf]="visibleRows" #idx="index">
            <tr>
              <td *ngFor="#entry of row">{{ entry }}</td>
            </tr>
          </template>
          <tr [style.height.px]="scrollBottom"></tr>
        </tbody>
      </md-data-table>
    </md-content>
    `,
    styles: [`
      container{
        overflow-y: auto;
        display: block;
      }
      md-data-table thead tr, md-data-table thead td {
        height: 40px;
      }
      md-data-table tbody tr, md-data-table tbody td {
        height: 32px;
      }
    `],
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
export class DataTable implements OnInit, OnChanges {
    @Input()
    private height: number;

    private virtualHeight: number = 0;
    private scrollTop: number = 0;
    private scrollBottom: number = 0;

    private firstVisible: number = 0;
    private lastVisible: number = 0;
    private numberOfVisibleRows: number = 0;

    private visibleRows: Array<Array<string>> = [];
    private rows: Array<Array<string>> = [];
    private columns: Array<Column> = [];
    private data$: Observable<Array<Array<string>>>;

    constructor(private http: Http,
                private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService,
                private projectService: ProjectService) {

                this.data$ = this.layerService.getSelectedLayer().map(layer => {
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

        this.updateVirtualHeight();
        this.updateVisibleRows(0, true);
        this.scrollTop = 0;
        this.scrollBottom = Math.max(0, this.virtualHeight - this.height);
        this.changeDetectorRef.markForCheck();
      });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
      if (changes["height"]) {
        this.numberOfVisibleRows = Math.max(Math.ceil((this.height - 42) / 32), 0);  // FIXME: remove magic numbers (row height, column height)
        this.updateVisibleRows(this.firstVisible, false);
      }
    }

    /**
    * Method to update/refresh the visible elements of the table.
    * @param newFirstVisible The new first visible element (table top row).
    * @param force Force the update (even if nothing may have changed).
    */
    updateVisibleRows(newFirstVisible: number, force: boolean) {
      if (force || newFirstVisible !== this.firstVisible || this.lastVisible - this.firstVisible < this.numberOfVisibleRows) {
        this.firstVisible = newFirstVisible;
        this.lastVisible = this.firstVisible + this.numberOfVisibleRows;
        this.visibleRows = this.rows.slice(Math.floor(this.firstVisible), Math.ceil(this.lastVisible));
      }
    }

    /**
    * Method to update/refresh the virtualHeight.
    */
    updateVirtualHeight() {
      this.virtualHeight = this.rows.length * 32 + this.columns.length * 42; // FIXME: remove magic numbers (row height, column height)
    }

    /**
    * Method to be called with the onScroll event.
    * @param event The scroll event.
    */
    onScroll(event: any) {
      this.scrollTop = Math.max(0, event.target.scrollTop);
      this.scrollBottom = Math.max(0, this.virtualHeight - event.target.scrollTop - this.height);
      // recalculate the first visible element!
      let newFirstVisible = (this.scrollTop / 32);
      this.updateVisibleRows(newFirstVisible, false);
    }

}
