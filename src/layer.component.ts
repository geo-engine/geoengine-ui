import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {Dragula, DragulaService} from "ng2-dragula/ng2-dragula";

import {Layer} from "./layer.model";

import {LayerService} from "./services/layer.service";

@Component({
    selector: "layer-component",
    template: `
    <md-content flex>
    <md-list [dragula]="'layer-bag'">
        <md-list-item *ngFor="#layer of layerService.getLayers() | async; #index = index"
                      md-ink (click)="layerService.setSelectedLayer(layer)"
                      [class.md-active]="layer === (layerService.getSelectedLayer() | async)"
                      (contextmenu)="replaceContextMenu($event, layer)">
            <div layout="column">
                <div layout="row">
                    <button md-button class="md-icon-button"
                            style="margin-left: -16px;"
                            aria-label="Settings"
                            (click)="layer.expanded=!layer.expanded">
                        <i *ngIf="!layer.expanded" md-icon>expand_more</i>
                        <i *ngIf="layer.expanded" md-icon>expand_less</i>
                    </button>

                    <div class="md-list-item-text" style="padding-top: 10px">
                        {{layer.name}}
                    </div>

                    <button md-button class="md-icon-button"
                            style="margin-right: -16px;"
                            aria-label="More"
                            *ngIf="layer === (layerService.getSelectedLayer() | async)"
                            (click)="replaceContextMenu($event, layer)">
                        <i md-icon>more_vert</i>
                    </button>
                </div>
                <div *ngIf="layer.expanded">
                    {{layer.name}}
                    <br>{{layer.name}}
                </div>
            </div>
            <md-divider
                [class.md-active]="layer === (layerService.getSelectedLayer() | async)">
            </md-divider>
        </md-list-item>
    </md-list>
    </md-content>
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
    md-list {
        height: 100%;
    }
    md-content {
        overflow-x: hidden;
    }
    `],
    viewProviders: [DragulaService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    directives: [MATERIAL_DIRECTIVES, Dragula]
})

export class LayerComponent {

    constructor(private dragulaService: DragulaService,
                private layerService: LayerService) {
        dragulaService.setOptions("layer-bag", {
            removeOnSpill: false,
            revertOnSpill: true
        });

        this.handleDragAndDrop();
    }

    handleDragAndDrop() {
        let dragIndex: number;
        let dropIndex: number;

        this.dragulaService.drag.subscribe((value: any) => {
            let [_, listItem, list] = value;
            dragIndex = this.domIndexOf(listItem, list);
//            console.log("drag", dragIndex);
        });
        this.dragulaService.drop.subscribe((value: any) => {
            let [_, listItem, list] = value;
            dropIndex = this.domIndexOf(listItem, list);
//            console.log("drop", dropIndex);

            let layers = this.layerService.getLayers().getValue();
            layers.splice(dropIndex, 0, layers.splice(dragIndex, 1)[0]);
            this.layerService.setLayers(layers);
        });
    }

    private domIndexOf(child: any, parent: any) {
        return Array.prototype.indexOf.call(parent.children, child);
    }

    replaceContextMenu(event: MouseEvent, layer: Layer) {
        event.preventDefault();
        console.log("A context menu for " + layer.name + " will appear in future versions!");
    }
}
