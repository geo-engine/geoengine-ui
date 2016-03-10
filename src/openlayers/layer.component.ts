import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from 'angular2/core';
import {layer, source, format, style, loadingstrategy, tilegrid} from 'openlayers';

import {ResultType} from '../operator.model';

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
    template: '',
    changeDetection: ChangeDetectionStrategy.Detached
})
export class MapLayerComponent implements OnChanges {
    @Input('type')
    private layerType: ResultType;

    @Input()
    private url: string;
    //    private url: (extent: Array<number>) => strin    
    @Input()
    private params: any;

    @Input()
    private style: any;

    private _layer: layer.Layer;

    get layer() {
        return this._layer;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        let isFirstChange = false;
        for(let property in changes) {
            if(changes[property].isFirstChange()) {
                isFirstChange = true;
                break;
            }
        }
        
        if(!isFirstChange) {
            // TODO: react on changes
            return;
        }
        
        switch (this.layerType) {
            case ResultType.POINTS:
                let vectorSource = new source.Vector({
                    format: new format.GeoJSON(),
                    url: this.url + '?' + Object.keys(this.params).map(
                        key => key + '=' + this.params[key]
                    ).join('&'),
                    wrapX: false
                });

                this._layer = new layer.Vector({
                    source: vectorSource,
                    style: new style.Style({
                        image: new style.Circle({
                            radius: 5,
                            fill: new style.Fill({ color: this.style.color }),
                            stroke: new style.Stroke({ color: '#000000', width: 1 })
                        })
                    })
                });
                break;

            case ResultType.RASTER:
                let wmsSource = new source.TileWMS({
                    url: this.url,
                    params: this.params,
                    wrapX: false
                });

                this._layer = new layer.Tile({
                    source: wmsSource,
                    opacity: this.style.opacity
                });
                break;
        }

        /*
        console.log('changes', changes, this.url);
        // TODO: proper **first** detection
        if (changes['url'].isFirstChange()) {
//            console.log("first", changes);
            
            switch(this.layerType) {
                case ResultType.POINTS:
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
                    
                case ResultType.RASTER:
                    let wmsSource = new source.TileWMS({
                        url: changes['url'].currentValue,
                        params: this.params
                    });
                    
                    this._layer = new layer.Tile({
                        source: wmsSource
                    });
                    break;
            }
            
        } else {
//            console.log("another change", changes);
            // TODO 
        }
        */
    }
}
