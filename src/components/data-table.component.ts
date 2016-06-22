import {
    Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChange,
    ViewChild, ElementRef, AfterViewInit, OnDestroy,
} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';
import {Http} from '@angular/http';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES, ITableSelectionChange, MdDataTable} from 'ng2-material';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import {SafeStylePipe} from '../app/safe-template.pipe';

import {ResultTypes} from '../operators/result-type.model';
import {GeoJsonFeatureCollection, GeoJsonFeature, FeatureID} from '../models/geojson.model';
import {VectorLayer} from '../layers/layer.model';
import {AbstractVectorSymbology} from '../symbology/symbology.model';
import {LoadingState} from '../shared/loading-state.model';

import {LayerService} from '../layers/layer.service';
import {ProjectService} from '../project/project.service';
import {MappingQueryService} from '../queries/mapping-query.service';

interface Column {
    name: string;
    type: 'string' | 'number' | '';
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
                            [selectable-value]="row.id"
                            (onChange)="change($event)"
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
    }
    md-data-table tbody tr,
    md-data-table tbody td,
    md-data-table tbody >>> .md-data-check-cell {
        height: 32px;
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
        datatable: new ViewChild(MdDataTable),
        container: new ViewChild('container'),
    },
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES],
    pipes: [SafeStylePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    // make visible in template
    LoadingState = LoadingState; // tslint:disable-line:variable-name

    selectable$: Observable<boolean>;

    @Input()
    private height: number;
    @ViewChild(MdDataTable)
    private datatable: MdDataTable;
    @ViewChild('container')
    private container: ElementRef;

    private selectedFeatureIds: Array<FeatureID>;

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
                        data$: vectorLayer.data.data$.map(data => {
                            if (data) { // TODO: needed?
                                let geojson: GeoJsonFeatureCollection = data;
                                return geojson.features;
                            }
                        }),
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
        this.data$.subscribe( (features: Array<GeoJsonFeature>) => {
            this.columns = [];
            this.propertyColumns = [];
            this.rows = [];

            if (features.length > 0) {
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
            this.updateScrollPosition(0);
            this.changeDetectorRef.markForCheck();
        });

        // this.selectable$.subscribe(x => console.log('selecatble', x));
    }

    ngAfterViewInit() {
            this.layerService.getSelectedFeaturesStream().subscribe(x => {
                this.selectedFeatureIds = x;
                this.updateSelectedRows();
            });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
      if (changes['height']) {
        this.numberOfVisibleRows = Math.max(
            Math.ceil((this.height - this.columnHeight) / this.rowHeight),
            0
        );
        this.updateVisibleRows(this.firstVisible, false);
      }
    }

    ngOnDestroy() {}

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
      if (this.datatable) {
          this.datatable._rows.filter(
              row => !row.isActive && this.selectedFeatureIds.indexOf(row.selectableValue) !== -1
          ).forEach(row => row.change());
      }
    }

    updateScrollPosition(scrollTop: number) {
        this.scrollTop = Math.max(0, scrollTop);
        this.scrollBottom = Math.max(0, this.virtualHeight - scrollTop - this.height);
        this.container.nativeElement.scrollTop = scrollTop;
    }

    /**
     * Method to update/refresh the virtualHeight.
     */
    updateVirtualHeight() {
      this.virtualHeight = this.rows.length *  this.rowHeight
        + this.columns.length * this.columnHeight;
    }

    updateSelectedRows() {
        let row = -1;
        const lookupId = this.selectedFeatureIds[this.selectedFeatureIds.length - 1];
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i]['id'] === lookupId) {
                row = i;
                break;
            }
        }
        const scrollTop = this.rowHeight * row;
        if (this.datatable) {
            this.deselectRows();
        }
        if (row !== -1) {
            this.updateScrollPosition(scrollTop);
            this.updateVisibleRows(row, true);
            this.changeDetectorRef.markForCheck();
        }
    }

    deselectRows() {
        this.datatable._rows.filter(
            row => row.isActive && this.selectedFeatureIds.indexOf(row.selectableValue) === -1
        ).forEach(row => row.change());
    }

    /**
     * Method to be called with the onScroll event.
     * @param event The scroll event.
     */
    onScroll(event: Event) {
        const target = event.target as HTMLElement;
        const scrollTop = target.scrollTop;
        const newFirstVisible = (this.scrollTop / this.rowHeight);
        this.updateScrollPosition(scrollTop);
        this.updateVisibleRows(newFirstVisible, false);
    }

    change(event: ITableSelectionChange) {
        // TODO: hande selections
        // console.log('selectableChange', event);
        // console.log('datatable', this.datatable);
    }

}
