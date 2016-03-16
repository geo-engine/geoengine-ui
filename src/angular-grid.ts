import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef,
        OnInit, AfterViewInit, ElementRef} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {BehaviorSubject, Observable} from "rxjs/Rx";

import Config from './config.model';
import {LayerService} from './services/layer.service';
import {ResultType} from './operator.model';

interface Column {
    name: string
}

@Component({
    selector: 'angular-grid',
    //    template: `
    //    <div *ngFor="#item of data$ | async">{{item}}</div>
    //    `,
    template: `
        <vaadin-grid
            [columns]="columns"
            [items]="data"
            [style.height.px]="height">
        </vaadin-grid>
    `,
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AngularGrid implements OnInit {
    @Input()
    private height: number;

    private data: Array<{}> = [];
    private columns: Array<Column> = [];

    private data$: Observable<Array<{}>>;
    private columns$: Observable<Array<Column>>;

    constructor(private http: Http,
                private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService) {

        this.data$ = this.layerService.getSelectedLayer()
                                      .map(layer => {
//            console.log("data", layer);
            if (layer === undefined) {
                return Observable.of([]);
            } else {
                switch (layer.resultType) {
                    case ResultType.POINTS:
                        return this.http.get(
                            Config.MAPPING_URL + '?' + Object.keys(layer.params).map(
                                key => key + '=' + encodeURIComponent(layer.params[key])
                            ).join('&') + '&format=csv'
                        ).map(data => {
//                            console.log("data", data);

                            let lines = data.text().split('\n');
                            let columns = lines[0].split(',')
                                .map(name => ({ name }));

                            let items: Array<{}> = [];
                            for (let line of lines.slice(1, lines.length - 1)) {
                                let splitted = line.split(',');
                                let item: any = {};
                                for (let i in splitted) {
                                    item[columns[i].name] = splitted[i];
                                }
                                items.push(item);
                            }

                            return items;
                        });

                    default:
                        return Observable.of([]);
                }
            }
        }).concatAll();

        this.columns$ = this.data$.map((items: Array<{}>) => {
//            console.log("column", items);
            if (items.length > 0) {
                return Object.keys(items[0])
                    .map((key: string) => ({ name: key }));
            } else {
                return [];
            }
        });

    }

    ngOnInit() {
        this.data$.subscribe((items: Array<{}>) => {
            this.data = items;

            if (items.length > 0) {
                this.columns = Object.keys(items[0])
                                     .map((key: string) => ({ name: key }));
            } else {
                this.columns = [];
            }

            this.changeDetectorRef.markForCheck();
        });
    }

}
