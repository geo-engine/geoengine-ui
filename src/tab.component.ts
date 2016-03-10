import {View, Component, Input, ViewEncapsulation, Output, EventEmitter} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
@Component({
    selector: 'tab-component'
})
@View({
    templateUrl: 'templates/tab.html',
    styles:[`
    .selected {
      background-color: #f5f5f5 !important;
    }
    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
    }
    button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [MATERIAL_DIRECTIVES]
})

export class TabComponent {
    @Input()
    private layerSelected: boolean;
    
    @Output('zoomIn')
    private zoomInEmitter = new EventEmitter<void>();
    
    @Output('zoomOut')
    private zoomOutEmitter = new EventEmitter<void>();
    
    @Output('zoomLayer')
    private zoomLayerEmitter = new EventEmitter<void>();
    
    @Output('zoomProject')
    private zoomProjectEmitter = new EventEmitter<void>();
    
    @Output('zoomMap')
    private zoomMapEmitter = new EventEmitter<void>();
    
}