import {Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy} from 'angular2/core';
import ol from 'openlayers';

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

    private _layer: ol.layer.Layer;

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
                let vectorSource = new ol.source.Vector({
                    format: new ol.format.GeoJSON(),
                    url: this.url + '?' + Object.keys(this.params).map(
                        key => key + '=' + encodeURIComponent(this.params[key])
                    ).join('&'),
                    wrapX: false
                });

                this._layer = new ol.layer.Vector({
                    source: vectorSource,
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({ color: this.style.color }),
                            stroke: new ol.style.Stroke({ color: '#000000', width: 1 })
                        })
                    })
                });
                break;

            case ResultType.RASTER:
                let wmsSource = new ol.source.TileWMS({
                    url: this.url,
                    params: this.params,
                    wrapX: false
                });

                this._layer = new ol.layer.Tile({
                    source: wmsSource,
                    opacity: this.style.opacity
                });
                break;
        }

    }
    
    getTabularData(): Array<{}> {
        switch(this.layerType) {
            case ResultType.POINTS:
                let pointSource = <ol.source.Vector> this.layer.getSource();
                
                let data: Array<{}> = [];
                for(let feature of pointSource.getFeatures()) {
                    let featureProperties = <any>feature.getProperties();
                    let geometryName: string = feature.getGeometryName();
                    let geometry = featureProperties[geometryName];
                    delete featureProperties[geometryName];
                    
                    let coordinates = geometry.getCoordinates();
                    featureProperties['x'] = coordinates[0];
                    featureProperties['y'] = coordinates[1];
                    
                    data.push(featureProperties);
                }
                return data;
            default:
                return [];
        }
    }
}
