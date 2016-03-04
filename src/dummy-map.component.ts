import {View, Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

@Component({selector: 'dummy-map-component'})
@View({
    template: '<img src="templates/map.jpg" style="width: 100%">',
    directives: [MATERIAL_DIRECTIVES]
})
export class DummyMapComponent {
}