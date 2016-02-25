import {Component, ViewChild, ElementRef, Input,
        AfterViewInit, OnChanges, SimpleChange, ContentChildren, QueryList} from 'angular2/core';
import {Map as OlMap, View as OlView,
        layer, source, format, style, loadingstrategy, tilegrid} from 'openlayers';

/**
 * The `ol-layer` component represents a single layer object of openLayer 3.
 * 
 * # Input Variables
 * * layerType
 * * url
 * * params
 * * style
 */
@Component({
    selector: 'ol-layer',
    template: ''
})
export class LayerComponent implements OnChanges {
    @Input('type')
    private layerType: string;
    
    @Input()
    private url: (extent: Array<number>) => string;
    
    @Input()
    private params: any;
    
    @Input()
    private style: string;
    
    private _layer: layer.Layer;
    
    get layer() {
        return this._layer;   
    }
    
    ngOnChanges(changes: {[propName: string]: SimpleChange}) {
        // TODO: proper **first** detection
        if (changes['url'].isFirstChange()) {
            //console.log("first", changes);
            
            switch(this.layerType) {
                case 'WFS':
                    let vectorSource = new source.Vector({
                        format: new format.GeoJSON(),
                        url: changes['url'].currentValue
                    });
                    
                    this._layer = new layer.Vector({
                        source: vectorSource,
                        style: new style.Style({
                            stroke: new style.Stroke({
                                color: this.style,
                                width: 2
                            })
                        })
                    });
                    break;
                    
                case 'WMS':
                    let wmsSource = new source.TileWMS({
                        url: changes['url'].currentValue,
                        params: this.params,
                        serverType: 'geoserver'
                    });
                    
                    this._layer = new layer.Tile({
                        source: wmsSource
                    });
                    break;
            }
            
        } else {
            //console.log("another change", changes);
            // TODO 
        }
    }
}

/**
 * The `ol-map` component represents an openLayers 3 map component.
 * it supports `ol-layer` components as child components.
 */
@Component({
    selector: 'ol-map',
    template: `<div #mapContainer
                    style="width: {{width}}px; height: {{height}}px; background: black;">
               </div>
               <ng-content></ng-content>`,
    styleUrls: [
        'node_modules/openlayers/css/ol.css'
    ]
})
export class MapComponent implements AfterViewInit {
    
    private map: OlMap;
    
    @ViewChild('mapContainer')
    private mapContainer: ElementRef;
    
    @Input()
    private width: number;
    
    @Input()
    private height: number;
    
    @ContentChildren(LayerComponent)
    private layers: QueryList<LayerComponent>;

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
    
}
