import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef,
        AfterViewInit, ElementRef} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {BehaviorSubject} from "rxjs/Rx";

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
            [columns]="columns$ | async"
            [items]="data$ | async"
            [style.height.px]="height">
        </vaadin-grid>
    `,
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AngularGrid implements AfterViewInit {
    @Input()
    private height: number;    
    
    private data$ = new BehaviorSubject([]);
    
    constructor(private http: Http,
                private changeDetectorRef: ChangeDetectorRef,
                private layerService: LayerService) {
        this.layerService.getSelectedLayer().subscribe(layer => {
//            console.log("table", layer);
            
            if(layer === undefined) {
                this.data$.next([]);
                return;
            }
            
            if(layer.resultType === ResultType.POINTS) {
//                console.log("POINTS");
                
                this.http.get(
                    Config.MAPPING_URL + '?' + Object.keys(layer.params).map(
                        key => key + '=' + encodeURIComponent(layer.params[key])
                    ).join('&') + '&format=csv'
                ).subscribe(data => {
                    let lines = data.text().split('\n');
                    let columns = lines[0].split(',')
                                          .map(name => ({name}));
                    
                    let items: Array<{}> = [];
                    for(let line of lines.slice(1, lines.length - 1)) {
                        let splitted = line.split(',');
                        let item: any = {};
                        for(let i in splitted) {
                            item[columns[i].name] = splitted[i];
                        }
                        items.push(item);
                    }
                    
                    this.data$.next(items);
                });
            } else {
                this.data$.next([]);
            }
        });
        
    }
    
    private get columns$() {
        return this.data$.map(items => {
            if(items.length > 0) {
                return Object.keys(items[0])
                             .map((key: string) => ({name: key}));
            } else {
                return [];
            }
        });
    }
    
//    private get dataSlice(): Array<{}> {
//        //return this.data.slice(0, Math.min(10, this.data.length));
//        return this.data;
//    }
    
    ngAfterViewInit() {
        // do this one time for the table
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        }, 0);
    }
    
//    dataSlice = [
//        {projectName: 'Project A', cost: {estimate: 10000, current: 8000}},
//        {projectName: 'Project B', cost: {estimate: 20000, current: 11000}},
//        {projectName: 'Project C', cost: {estimate: 15000, current: 1000}},
//        {projectName: 'Project D', cost: {estimate: 10000, current: 3000}},
//        {projectName: 'Project E', cost: {estimate: 15000, current: 9000}},
//    ];
//    columns = [
//        {name : 'projectName'},
//        {name : 'cost.estimate'},
//        {name : 'cost.current'},
//    ];

}