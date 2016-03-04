import {View, Component, ViewEncapsulation} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
@Component({
    selector: 'tab-component',
    inputs: ['disabled']
})
@View({
    templateUrl: 'templates/tab.html',
    styles:[`
    .selected {
      background-color: lightgrey !important;
    }`],
    directives: [MATERIAL_DIRECTIVES]
})

export class TabComponent {
    disabled:boolean;
}