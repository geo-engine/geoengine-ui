import {Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {TabComponent} from './tab.component';
import {DummyMapComponent} from './dummy-map.component';
import {SampleComponent} from './sample.component';
import {Layer} from './layer'
import {Dragula} from 'ng2-dragula/ng2-dragula';
import {DragulaService} from 'ng2-dragula/ng2-dragula';
import {AngularGrid} from './angular-grid'

@Component({
    selector: 'wave-app',
    templateUrl: 'templates/app.html',
    styleUrls: ['templates/app.css'],
    viewProviders: [DragulaService],
	directives: [MATERIAL_DIRECTIVES, TabComponent, DummyMapComponent, SampleComponent, Dragula, AngularGrid]
})
export class AppComponent {
    visible:boolean = true;
    dataTableVisible:boolean = true;

    selected:Layer;
    hasSelected:boolean = false;

    clicked(message: string) {
        alert(message);
    }

    layersClicked(){
        this.visible = !this.visible;
    }

    clickLayer(layer:Layer){
        if(this.hasSelected){
            if(this.selected == layer) {
                this.hasSelected = false;
            }
        } else {
            this.hasSelected = true;
        }
        this.selected = layer;
    }

    expandLayer(event: MouseEvent, layer:Layer){
        event.stopPropagation();
        layer.expanded = !layer.expanded;
    }


    expandData(){
        this.dataTableVisible = !this.dataTableVisible;
    }

    replaceContextMenu(event: MouseEvent, layer:Layer){
        event.preventDefault();
        alert("A context menu for " + layer.name + " will appear in future versions!");
    }

    layers: Layer[] = [
        {
            "name": "Layer 1",
            "payload" : "Payload 1",
            "expanded" : false,
        },
        {
            "name": "Layer 2",
            "payload" : "Payload 2",
            "expanded" : false,
        },
        {
            "name": "Layer 3",
            "payload" : "Payload 3",
            "expanded" : false,
        },
    ];
}