import {View, Component, ViewEncapsulation} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
@Component({selector: 'tab-component'})
@View({
    templateUrl: 'templates/tab.html',
    directives: [MATERIAL_DIRECTIVES],
    encapsulation: ViewEncapsulation.None
})

export class TabComponent {
}