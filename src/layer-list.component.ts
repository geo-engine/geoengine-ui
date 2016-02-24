import {View, Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

@Component({
    selector: 'list-basic-usage',
    inputs: ['visible']
})
@View({
    templateUrl: 'templates/layerlist.html',
    directives: [MATERIAL_DIRECTIVES]
})
export class LayerListComponent {
    layers = [
        {
            name: 'Layer 1',
        },
        {
            name: 'Layer 2',
        },
        {
            name: 'Layer 3',
        }
    ];

    getFirst(){
        return this.layers[0];
    }
}