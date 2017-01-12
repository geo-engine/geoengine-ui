import {
    Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChange,
    ViewChild, ElementRef, AfterViewInit, OnDestroy,
} from '@angular/core';
import {Http} from '@angular/http';

import {Observable, Subscription} from 'rxjs/Rx';

import {ResultTypes} from '../operators/result-type.model';
import {GeoJsonFeature, FeatureID} from '../models/geojson.model';
import {VectorLayer} from '../layers/layer.model';
import {AbstractVectorSymbology} from '../symbology/symbology.model';
import {LoadingState} from '../shared/loading-state.model';

import {LayerService, SelectedFeatures} from '../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {MappingQueryService} from '../queries/mapping-query.service';

interface Column {
    name: string;
    type: 'string' | 'number' | '';
    unit: string;
}

interface Row {
    id?: string | number;
    properties?: {[key: string]: number | string};
}

@Component({
    selector: 'wave-data-table',
    template: `
    <div #container class="container" [style.height.px]="height" (scroll)="onScroll($event)">
        <template [ngIf]="layerService.getIsAnyLayerSelectedStream() | async">
            <md-data-table [selectable]="selectable$ | async" (onSelectableChange)="change($event)">
                <thead>
                    <tr [style.height.px]="scrollTop"></tr>
                    <tr md-data-table-header-selectable-row (onChange)="change($event)">
                        <th *ngFor="let column of columns">{{column.name}} </th>
                        <th *ngFor="let column of propertyColumns">{{column.name}} </th>
                    </tr>
                </thead>
                <tbody>
                    <template ngFor let-row [ngForOf]="visibleRows" let-idx="index">
                        <tr md-data-table-selectable-row
                            (onChange)="onRowSelectionChange($event)"
                        >
                            <td *ngFor="let column of columns">{{row[column.name]}}</td>
                            <td
                                *ngFor="let column of propertyColumns"
                            >{{row?.properties[column.name]}}</td>
                        </tr>
                    </template>
                    <tr [style.height.px]="scrollBottom"></tr>
                </tbody>
            </md-data-table>
        </template>
        <template [ngIf]="!(layerService.getIsAnyLayerSelectedStream() | async)">
            <div class="backdrop">
              <span>no layer selected</span>
            </div>
        </template>
        <md-progress-circle
            mode="indeterminate"
            *ngIf="(state$ | async) === LoadingState.LOADING"
            [style.height.px]="height / 2"
            [style.width.px]="height / 2"
            [style.top.px]="height / 4"
            [style.left]="'calc(50% - ' + height / 2 + 'px)' | waveSafeStyle"
        ></md-progress-circle>
    </div>
    `,
    styles: [`
    :host {
        display: block;
    }
    .container {
        position: relative;
        overflow-y: auto;
        display: block;
    }

    md-data-table thead,
    md-data-table tbody {
        background-color: white;
    }

    md-data-table thead tr,
    md-data-table thead th,
    md-data-table thead >>> .md-data-check-cell {
        height: 40px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    md-data-table tbody tr,
    md-data-table tbody td,
    md-data-table tbody >>> .md-data-check-cell {
        height: 32px;
       text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    md-progress-circle {
        position: absolute;
    }

    .backdrop {
        display: table;
        width: 100%;
        height: 100%;
        text-align: center;
        color: darkgray;
    }

    .backdrop span {
        display: table-cell;
        vertical-align: middle;
    }

    `],
    queries: {
        datatable: new ViewChild(undefined), // TODO: fix
        container: new ViewChild('container'),
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    // make visible in template
    LoadingState = LoadingState; // tslint:disable-line:variable-name

    selectable$: Observable<boolean>;

    @Input()
    private height: number;
    @ViewChild(undefined) // TODO: fix
    private datatable: {_rows : {filter: (row) => Observable<{change: (idk) => void}>}}; // TODO: fix
    @ViewChild('container')
    private container: ElementRef;

    private selectedFeatures: SelectedFeatures;

    private virtualHeight: number = 0;
    private scrollTop: number = 0;
    private scrollBottom: number = 0;

    private firstVisible: number = 0;
    private lastVisible: number = 0;
    private numberOfVisibleRows: number = 0;

    private rowHeight = 32; // TODO: input or css?
    private columnHeight = 42;

    private visibleRows: Array<Row> = [];
    private rows: Array<Row> = [];
    private columns: Array<Column> = [];
    private propertyColumns:  Array<Column> = [];
    private data$: Observable<Array<GeoJsonFeature>>;
    private state$: Observable<LoadingState>;

    private dataSubscription: Subscription;
    private featureSubscription: Subscription;

    constructor(
        private http: Http,
        private changeDetectorRef: ChangeDetectorRef,
        private layerService: LayerService,
        private projectService: ProjectService,
        private mappingQueryService: MappingQueryService
    ) {
        // console.log("DataTableComponent", "constructor");

        const dataStream = layerService.getSelectedLayerStream().map(layer => {
            if (layer === undefined) {
                return { data$: Observable.of([]),
                    state$: Observable.of(LoadingState.OK),
                    selectable: false,
                };
            }
            switch (layer.operator.resultType) {
                case ResultTypes.POINTS:
                case ResultTypes.LINES:
                case ResultTypes.POLYGONS:
                    let vectorLayer = layer as VectorLayer<AbstractVectorSymbology>;
                    return {
                        data$: vectorLayer.data.data$.map(data => data.features),
                        state$: vectorLayer.data.state$,
                        selectable: true,
                    };
                case ResultTypes.RASTER:
                    return {
                        data$: Observable.of([{properties: {
                            Attribute: 'Value',
                            Unit: layer.operator.getUnit('value').toString() || 'undefined',
                            Datatype: layer.operator.getDataType('value').toString() || 'undefined',
                        }}]),
                        state$: Observable.of(LoadingState.OK),
                        selectable: false,
                    };
                default:
                    return {
                        data$: Observable.of([]),
                        state$: Observable.of(LoadingState.OK),
                        selectable: false,
                    };
            };
        });

        this.data$ = dataStream.switchMap(stream => stream.data$);
        this.state$ = dataStream.switchMap(stream => stream.state$);
        this.selectable$ = dataStream.map(stream => stream.selectable);
    }

    ngOnInit() {
        // console.log("DataTableComponent", "ngOnInit");
        this.dataSubscription = this.data$.subscribe( (features: Array<GeoJsonFeature>) => {
            this.columns = [];
            this.propertyColumns = [];
            this.rows = [];

            if (features.length > 0) {
                //if ( features[0].id ) {
                //    this.columns = [{name: 'id', type: 'string', unit: undefined}];
                //};
                if (features[0].properties) {
                    this.propertyColumns = Object.keys(features[0].properties).filter(x => !x.startsWith('___'))
                        .map(x => { return {name: x, type: '', unit: ''} as Column; });
                 }
                this.rows = features;
            }

            // only needs to be called once for each "data"
            this.updateVirtualHeight();

            this.updateVisibleRows(0, true);
            this.changeDetectorRef.markForCheck();
        });

        // this.selectable$.subscribe(x => console.log('selecatble', x));
    }

    ngAfterViewInit() {
            this.featureSubscription = this.layerService.getSelectedFeaturesStream().subscribe(x => {
                this.updateSelectedRows(x);
            });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
      if (changes['height']) {
        this.numberOfVisibleRows = Math.max(
            Math.ceil((this.height - this.columnHeight) / this.rowHeight),
            0
        );
        this.updateVisibleRows(this.firstVisible, true);
      }
    }

    ngOnDestroy() {
        this.dataSubscription.unsubscribe();
        this.featureSubscription.unsubscribe();
    }

    /**
     * Method to update/refresh the visible elements of the table.
     * @param newFirstVisible The new first visible element (table top row).
     * @param force Force the update (even if nothing may have changed).
     */
    updateVisibleRows(newVisible: number, force: boolean) {
      if ( force || newVisible < this.firstVisible || newVisible > this.lastVisible) {
              // don't scroll outside of the table.
          this.firstVisible = (
              Math.min(
                  newVisible, Math.max(
                      this.rows.length - this.numberOfVisibleRows + 1, 0
                  )
              )
          );
          this.lastVisible = this.firstVisible + this.numberOfVisibleRows - 1;
          this.visibleRows = this.rows.slice(
             this.firstVisible, this.lastVisible
          );
          this.updateScrollPosition(this.firstVisible * this.rowHeight);
      }

      if (this.datatable) {
          this.datatable._rows.filter(
              row => {
                  const contains = this.selectedFeatures.selected.contains(row.selectableValue);
                  return (!row.isActive && contains) || (row.isActive && !contains);
              }
          ).forEach(row => row.change({}));
      }
      this.changeDetectorRef.markForCheck();
    }

    /**
     * Method to be called with the onScroll event.
     * @param event The scroll event.
     */
    onScroll(event: Event) {
        const target = event.target as HTMLElement;
        const scrollTop = target.scrollTop;
        const newFirstVisible = Math.max(0, Math.min(this.rows.length, scrollTop / this.rowHeight));
        this.updateVisibleRows(newFirstVisible, true);
    }

    change(event: {}) { // fix
        // const trueRemove = this.datatable._rows.filter(
        //     x => !x.isActive && this.selectedFeatures.selected.indexOf(x.selectableValue) !== -1
        // ).map(x => x.selectableValue);
        // const trueAdd =  event.values.filter(
        //     x => this.selectedFeatures.selected.indexOf(x) === -1
        // );

        // console.log("ITableSelectionChange trueAdd", trueAdd, "trueRemove", trueRemove);
        // this.layerService.updateSelectedFeatures(trueAdd, trueRemove); // FIXME: game of life :(
    }

    onRowSelectionChange(event:  {isActive: boolean, selectableValue: FeatureID}) { // fix
        if (event.isActive) {
             this.layerService.updateSelectedFeatures([event.selectableValue], []);
        } else {
             this.layerService.updateSelectedFeatures([], [event.selectableValue]);
        }
    }

    private updateScrollPosition(scrollTop: number) {
        this.scrollTop = Math.max(0, scrollTop);
        this.scrollBottom = Math.max(0, this.virtualHeight - scrollTop - this.height);
        this.container.nativeElement.scrollTop = scrollTop;
    }

    /**
     * Method to update/refresh the virtualHeight.
     */
    private updateVirtualHeight() {
      this.virtualHeight = this.rows.length *  this.rowHeight
        + this.columns.length * this.columnHeight;
    }

    private updateSelectedRows(selection: SelectedFeatures) {
        if ( !(this.selectedFeatures) || selection.selected !== this.selectedFeatures.selected) {
            this.selectedFeatures = selection;

            let row = -1;
            if (selection.focus) {
                for (let i = 0; i < this.rows.length; i++) {
                    if (this.rows[i].id === selection.focus) {
                        row = i;
                        break;
                    }
                }
            }
            this.updateVisibleRows((row !== -1) ? row : this.firstVisible, false);
        }
    }
}
