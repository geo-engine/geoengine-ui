import {Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MapComponent, LayerComponent} from './openlayers/map';
import {TabComponent} from './tab.component'
import {LayerListComponent} from './layer-list.component'

@Component({
    selector: 'wave-app',
    templateUrl: 'templates/app.html',
	directives: [
        MATERIAL_DIRECTIVES,
        MapComponent,
        LayerComponent,
		TabComponent,
		LayerListComponent
    ]
})
export class AppComponent {
    visible:boolean = false;
    
    private mapSpace = {
        height: window.innerHeight - 200 // TODO
    };
    
    clicked(message: string) {
        alert(message);
    }

    layersClicked(){
        this.visible = !this.visible;
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
}
