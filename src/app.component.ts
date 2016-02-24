import {Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {TabComponent} from './tab.component'
import {LayerListComponent} from './layer-list.component'
import {DummyMapComponent} from './dummy-map.component'

@Component({
    selector: 'wave-app',
    templateUrl: 'templates/app.html',
	directives: [MATERIAL_DIRECTIVES, TabComponent, LayerListComponent, DummyMapComponent]
})
export class AppComponent {
    visible:boolean = false;

    clicked(message: string) {
        alert(message);
    }

    layersClicked(){
        this.visible = !this.visible;
    }
}