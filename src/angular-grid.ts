import {Component} from 'angular2/core';

@Component({
    selector: 'angular-grid',
    template: `
        <vaadin-grid [columns]="myColumns" [items]="myItems"
        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
        </vaadin-grid>
    `
})
export class AngularGrid {
    myItems = [
        {projectName: 'Project A', cost: {estimate: 10000, current: 8000}},
        {projectName: 'Project B', cost: {estimate: 20000, current: 11000}},
        {projectName: 'Project C', cost: {estimate: 15000, current: 1000}},
        {projectName: 'Project D', cost: {estimate: 10000, current: 3000}},
        {projectName: 'Project E', cost: {estimate: 15000, current: 9000}},
    ];
    myColumns = [
        {name : 'projectName'},
        {name : 'cost.estimate'},
        {name : 'cost.current'},
    ];
    size = 2;
}