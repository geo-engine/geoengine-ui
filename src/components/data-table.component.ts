import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef,
        OnInit, AfterViewInit, ElementRef, OnChanges, SimpleChange} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {BehaviorSubject, Observable} from 'rxjs/Rx';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

import Config from '../models/config.model';
import {ResultTypes} from '../operators/result-type.model';
import {GeoJsonFeatureCollection, GeoJsonFeature} from '../models/geojson.model';
import {Layer, VectorLayer, RasterLayer} from '../models/layer.model';

import {LayerService} from '../services/layer.service';
import {ProjectService} from '../services/project.service';
import {MappingQueryService, WFSOutputFormats} from '../services/mapping-query.service';


interface Column {
    name: string;
    type: 'string' | 'number' | '';
}

@Component({
    selector: 'wv-data-table',
    template: `
    <md-content class='container' [style.height.px]='height' (scroll)='onScroll($event)'>
      <md-data-table>
        <thead>
          <tr [style.height.px]='scrollTop'></tr>
          <tr>
            <th *ngFor='#column of columns'>{{column.name}} </th>
            <th *ngFor='#column of propertyColumns'>{{column.name}} </th>
          </tr>
        </thead>
        <tbody>
          <template ngFor #row [ngForOf]='visibleRows' #idx='index'>
            <tr>
                <td *ngFor='#column of columns'>{{row[column.name]}}</td>
                <td *ngFor='#column of propertyColumns'>{{row?.properties[column.name]}}</td>
            </tr>
          </template>
          <tr [style.height.px]='scrollBottom'></tr>
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
    // <div *ngFor='#item of data'>{{item}}</div>
    // `,
    // template: `
    //     <vaadin-grid
    //         [columns]='columns'
    //         [items]='data'
    //         [style.height.px]='height'>
    //     </vaadin-grid>
    // `,
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, OnChanges {
    @Input()
    private height: number;

    private virtualHeight: number = 0;
    private scrollTop: number = 0;
    private scrollBottom: number = 0;

    private firstVisible: number = 0;
    private lastVisible: number = 0;
    private numberOfVisibleRows: number = 0;

    private visibleRows: Array<{}> = [];
    private rows: Array<{}> = [];
    private columns: Array<Column> = [];
    private propertyColumns:  Array<Column> = [];
    private data$: Observable<Array<GeoJsonFeature>>;

    constructor(private http: Http,
                private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService,
                private projectService: ProjectService,
                private mappingQueryService: MappingQueryService) {

        // TODO: use flatMapLatest on next rxjs version
        this.data$ = this.layerService.getSelectedLayerStream().map(layer => {
            if (layer === undefined) {
                return Observable.of([]);
            }
            switch (layer.operator.resultType) {
                case ResultTypes.POINTS:
                case ResultTypes.LINES:
                case ResultTypes.POLYGONS: {
                    let vectorLayer = layer as VectorLayer<any>;
                    return vectorLayer.getDataStream().map(data => {
                        if (data) { // TODO: needed?
                            let geojson: GeoJsonFeatureCollection = data;
                            return geojson.features;
                        }
                      });
                  }
                case ResultTypes.RASTER:
                    return Observable.of([{properties: {
                        Attribute: 'Value',
                        Unit: layer.operator.getUnit('value').toString() || 'undefined',
                        Datatype: layer.operator.getDataType('value').toString() || 'undefined',
                    }}]);
                default:
                    return Observable.of([]);
            };
        }).switch();
    }

    ngOnInit() {
      this.data$.subscribe( (features: Array<GeoJsonFeature>) => {
          this.columns = [];
          this.propertyColumns = [];
          this.rows = [];

          if (features.length > 0) {
            // let columns: Set<string> = new Set();
            /*
            for (let feature of features) {
                 console.log(Object.keys(feature));
            }
            */
            if ( features[0].id ) {
                this.columns = [{name: 'id', type: 'string'}];
            };
            if (features[0].properties) {
                this.propertyColumns = Object.keys(features[0].properties).map(x => {
                     return {name: x, type: ''} as Column;
                 });
             }
            this.rows = features;
        }

        this.updateVirtualHeight();
        this.updateVisibleRows(0, true);
        this.scrollTop = 0;
        this.scrollBottom = Math.max(0, this.virtualHeight - this.height);
        this.changeDetectorRef.markForCheck();
      });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
      if (changes['height']) {
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
      if ( force || newFirstVisible !== this.firstVisible
          || this.lastVisible - this.firstVisible < this.numberOfVisibleRows ) {
        this.firstVisible = newFirstVisible;
        this.lastVisible = this.firstVisible + this.numberOfVisibleRows;
        this.visibleRows = this.rows.slice(
            Math.floor(this.firstVisible), Math.ceil(this.lastVisible)
        );
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
        console.log(event);
        this.scrollTop = Math.max(0, event.target.scrollTop);
        this.scrollBottom = Math.max(0, this.virtualHeight - event.target.scrollTop - this.height);
        // recalculate the first visible element!
        let newFirstVisible = (this.scrollTop / 32);
        this.updateVisibleRows(newFirstVisible, false);
    }

}
