import {Component, ViewChild, ElementRef, AfterViewInit, NgZone} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {MapComponent, LayerComponent} from './openlayers/map';
import {TabComponent} from './tab.component'
import {LayerListComponent} from './layer-list.component'

interface MapSpace {
    height: number,
    width?: number
}

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
export class AppComponent implements AfterViewInit {
    visible:boolean = false;
    
    @ViewChild('topRow')
    private topRow: ElementRef;
    
    @ViewChild('bottomRow')
    private bottomRow: ElementRef;
    
    private mapSpace: MapSpace = {
        height: 200 // TODO
    };
    
    constructor(private _zone: NgZone) {
        
    }
    
    ngAfterViewInit() {
            let topRowHeight = this.topRow.nativeElement.scrollHeight;
            let bottomRowHeight = this.bottomRow.nativeElement.scrollHeight;
            let mapHeight = window.innerHeight - topRowHeight - bottomRowHeight;
            
            console.log('height', 'old', this.mapSpace.height, 'new', mapHeight, this.mapSpace.height !== mapHeight);
            
            if(this.mapSpace.height != mapHeight) {
                this._zone.overrideOnTurnDone(() => {
                    this.mapSpace.height = mapHeight;
                    
                    this._zone.overrideOnTurnDone(undefined);
                });
            }
    }
    
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
    
    private halveSize() {
        this.mapSpace.height = this.mapSpace.height / 2;
    }
}
