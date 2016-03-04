import {Component, ViewChild, ElementRef, Input,
        AfterViewInit, SimpleChange,
        ContentChildren, QueryList, AfterViewChecked} from 'angular2/core';
import {Map as OlMap, View as OlView, layer, source} from 'openlayers';
import {LayerComponent} from './layer';


/**
 * The `ol-map` component represents an openLayers 3 map component.
 * it supports `ol-layer` components as child components.
 */
@Component({
    selector: 'ol-map',
    template: `<div #mapContainer
                     style="background: black; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
               </div>
               <ng-content></ng-content>`,
    styleUrls: [
        'node_modules/openlayers/css/ol.css'
    ]
})
export class MapComponent implements AfterViewInit, AfterViewChecked  {
    
    private map: OlMap;
    
    @ViewChild('mapContainer')
    private mapContainer: ElementRef;
    
    /*
    @Input('width')
    private _width: string | number;
    
    @Input('height')
    private _height: string | number;
    */
    
    @ContentChildren(LayerComponent)
    private layers: QueryList<LayerComponent>;
    
    private isSizeChanged = false;
    
    /**
     * Notify the map that the viewport has resized.
     */
    resize() {
        // will be set to false after view checked event
        this.isSizeChanged = true;
    }

    ngAfterViewInit() {
        let backgroundLayer = new layer.Tile({
            source: new source.OSM()
        });
        
        this.map = new OlMap({
            target: this.mapContainer.nativeElement,
            layers: [backgroundLayer],
            view: new OlView({
              projection: 'EPSG:4326',
              center: [0, 0],
              zoom: 0,
              maxResolution: 0.703125
            })
        });
        
        // initialize layers
        // TODO: remove toArray when forEach is implemented
        this.layers.toArray().forEach(
            (layerComponent: LayerComponent) => this.map.addLayer(layerComponent.layer)
        );
        
        this.layers.changes.subscribe(_ => {
            // react on changes by removing all layers and inserting them
            // in the correct order.
            
            //console.log("a change!!");
            
            this.map.getLayers().clear();
            this.map.getLayers().push(backgroundLayer);
            this.layers.toArray().forEach(
                (layerComponent: LayerComponent) => this.map.getLayers().push(layerComponent.layer)
            );
        });
    }
    
    ngAfterViewChecked() {
        if(this.isSizeChanged) {
            this.map.updateSize();
            this.isSizeChanged = false;
        }
    }
    
}
