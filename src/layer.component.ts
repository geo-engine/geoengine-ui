import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

import {Layer} from './layer.model';

@Component({
    selector: 'layer-component',
    template: `
    <md-list [dragula]="'layer-bag'" [dragulaModel]="layers">
        <md-list-item md-ink
            *ngFor="#item of layers; #index = index"
             (click)="clickLayer(item)"
             [class.md-active]="hasSelected && item === selected"
             (contextmenu)="replaceContextMenu($event, item)">
                <button md-button class="md-icon-button" style="margin-left: -16px;"
                        aria-label="Settings"
                        (click)="expandLayer($event, item)">
                    <i *ngIf="!item.expanded" md-icon>expand_more</i>
                    <i *ngIf="item.expanded" md-icon>expand_less</i>
                </button>

                <div class="md-list-item-text">
                    {{item.name}}
                </div>

                <button md-button class="md-icon-button"  style="margin-right: -16px;"
                        aria-label="More"
                        (click)="clicked('A menu will appear in future versions')">
                    <i md-icon>more_vert</i>
                </button>
                
                <div *ngIf="item.expanded">
                    {{item.name}}
                    <br>{{item.name}}
                </div>
            <md-divider [class.md-active]="hasSelected && item === selected"></md-divider>
        </md-list-item>
    </md-list>
    `,
    styles: [`
    .md-active {
        background: #f5f5f5;
    }
    md-divider.md-active {
        border-top-color: #3f51b5;
    }
    .md-list-item-text {
        width: 110px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
    `],
    viewProviders: [DragulaService],
    directives: [MATERIAL_DIRECTIVES, Dragula]
})

export class LayerComponent {
    @Input()
    private layers: Array<Layer>;    
    
    private selected: Layer;
    private get hasSelected() {
       return this.selected !== undefined;
    }
    
    @Output('selected')
    private selectedEmitter: EventEmitter<Layer> = new EventEmitter();
    
    constructor(private dragulaService: DragulaService) {
        dragulaService.setOptions('layer-bag', {
            removeOnSpill: false,
            revertOnSpill: true
        });
    }
    
    clickLayer(layer: any) {
        this.selected = layer;
        
        this.selectedEmitter.emit(this.selected);
    }
    
    replaceContextMenu(event: MouseEvent, layer: Layer) {
        event.preventDefault();
        console.log("A context menu for " + layer.name + " will appear in future versions!");
    }
}
