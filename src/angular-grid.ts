import {Component, Input, ChangeDetectionStrategy} from 'angular2/core';

@Component({
    selector: 'angular-grid',
//    template: `
//    <div *ngFor="#item of dataSlice">{{item}}</div>
//    `,
    template: `
        <vaadin-grid
            [columns]="columns"
            [items]="dataSlice">
        </vaadin-grid>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AngularGrid {
    @Input()
    private data: Array<{}> = [];    
    
    private get columns() {
        if(this.data.length > 0) {
            console.log("keys", Object.keys(this.data[0]));
            
            return Object.keys(this.data[0])
                         .map((key: string) => ({name: key}));
        } else {
            return [];
        }
    }
    
    private get dataSlice(): Array<{}> {
        return this.data.slice(0, Math.min(10, this.data.length));
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
//    size = 2;
}