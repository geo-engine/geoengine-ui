import {Injectable} from "angular2/core";
import {BehaviorSubject} from "rxjs/Rx";

import {Layer} from '../layer.model';

@Injectable()
export class LayerService {
    private layers: BehaviorSubject<Array<Layer>> = new BehaviorSubject([]);
    private selectedLayer: BehaviorSubject<Layer> = new BehaviorSubject(undefined);
    
    getLayers() {
        return this.layers;
    }
    
    setSelectedLayer(layer: Layer) {
        this.selectedLayer.next(layer);
    }
    
    getSelectedLayer() {
        return this.selectedLayer.asObservable();
    }
}