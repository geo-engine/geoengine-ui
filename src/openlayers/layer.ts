import {Component, Input, OnChanges, SimpleChange} from 'angular2/core';
import {layer, source, format, style, loadingstrategy, tilegrid} from 'openlayers';

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
