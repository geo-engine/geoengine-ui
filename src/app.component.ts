import {Component, ViewChild} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {TabComponent} from './tab.component';
import {DummyLayer} from './DummyLayer'
import {Dragula} from 'ng2-dragula/ng2-dragula';
import {DragulaService} from 'ng2-dragula/ng2-dragula';
import {AngularGrid} from './angular-grid';
import {MapComponent} from './openlayers/map';
import {LayerComponent} from './openlayers/layer';

@Component({
    selector: 'wave-app',
    templateUrl: 'templates/app.html',
    styleUrls: ['templates/app.css'],
    viewProviders: [DragulaService],
	directives: [MATERIAL_DIRECTIVES, TabComponent, MapComponent, Dragula, AngularGrid]
})
export class AppComponent {
    layerListVisible:boolean = true;
    dataTableVisible:boolean = true;

    selected:DummyLayer;
    hasSelected:boolean = false;

    @ViewChild(MapComponent)
    private mapComponent: MapComponent;


    clicked(message: string) {
        alert(message);
    }

    layersClicked(){
        this.layerListVisible = !this.layerListVisible;
        this.mapComponent.resize();        
    }
    
    private layers: Array<any> = [
        {
            'type': 'WFS',
            'url': (extent: Array<number>) => 'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=2.0.0&' +
                                              'request=GetFeature&outputFormat=application/json&typeNames=states&' +
                                              'srsName=EPSG:3857' /*+ 
                         '&bbox=' + extent.join(',') + ',EPSG:3857'*/,
            'params': {},
            'style': 'rgba(0, 0, 255, 1.0)'
        }
    ];
    
    private addLayer() {
        console.log("push!");
        this.layers.push({
            'type': 'WMS',
            'url': 'http://demo.boundlessgeo.com/geoserver/wms?LAYERS=topp:states',
            'params': {'LAYERS': 'topp:states'},
            'style': ''
        });
    }
    
    private swapLayers() {
        console.log("swap!");
        this.layers.reverse();
    }

    clickLayer(layer:DummyLayer){
        if(this.hasSelected){
            if(this.selected == layer) {
                this.hasSelected = false;
            }
        } else {
            this.hasSelected = true;
        }
        this.selected = layer;
    }

    expandLayer(event: MouseEvent, layer:DummyLayer){
        event.stopPropagation();
        layer.expanded = !layer.expanded;
    }

    expandData(){
        this.dataTableVisible = !this.dataTableVisible;
        this.mapComponent.resize();
    }

    replaceContextMenu(event: MouseEvent, layer:DummyLayer){
        event.preventDefault();
        alert("A context menu for " + layer.name + " will appear in future versions!");
    }


    dummyLayers: DummyLayer[] = [
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
