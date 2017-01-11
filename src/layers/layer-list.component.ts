import {Component, ChangeDetectionStrategy, OnDestroy, ViewEncapsulation} from '@angular/core';

import {DragulaService} from 'ng2-dragula/ng2-dragula';

import Config from '../app/config.model';

import {SymbologyType, Symbology} from '../symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {LoadingState} from '../shared/loading-state.model';

import {LayerService} from '../layers/layer.service';
import {Subscription} from "rxjs";

@Component({
    selector: 'wave-layer-list',
    template: `
<div class="container" flex>
  <md-list [dragula]="layer-bag">
    <md-list-item
      *ngIf="(layerService.getLayersStream() | async).length === 0"
      class="no-layer"
    >no layer available</md-list-item>
    <template ngFor let-layer [ngForOf]="layerService.getLayersStream() | async">
    <md-list-item class="unsized-list-item"
                  
                  (click)="layerService.setSelectedLayer(layer)"
                  [class.active-layer]="layer === (layerService.getSelectedLayerStream() | async)"
                  (contextmenu)="replaceContextMenu($event, layer)"
                  [title]="layer.name"
    >
      <div class="list-item-column" >
        <div class="list-item-row" >
          <button md-icon-button
                  style="margin-left: -16px;"
                  aria-label="Settings"
                  (click)="toggleLayer(layer)">
            <md-icon *ngIf="!layer.expanded">expand_more</md-icon>
            <md-icon *ngIf="layer.expanded">expand_less</md-icon>
          </button>
          <div #layerName class="md-list-item-text" style="padding-top: 10px">
            {{layer.name}}
          </div>

          <button md-icon-button
                  style="margin-right: -16px; visibility: hidden;"
                  aria-label="More"
                  *ngIf="layer === (layerService.getSelectedLayerStream() | async)"
                  (click)="replaceContextMenu($event, layer)"
                  disabled="true"
          >
            <md-icon>more_vert</md-icon>
          </button>
          <md-progress-circle
            mode="indeterminate"
            *ngIf="(layer.loadingState | async) === LoadingState.LOADING"
          ></md-progress-circle>
          <button
            md-button class="md-icon-button md-warn error-button" aria-label="Reload"
            *ngIf="(layer.loadingState| async) === LoadingState.ERROR"
            (click)="layer.reload()"
          >
            <md-icon>replay</md-icon>
          </button>
        </div>
        <div *ngIf="layer.expanded" [ngSwitch]="layer.symbology.getSymbologyType()" class="list-item-row">

          <wave-legendary-points
            *ngSwitchCase="_enumSymbologyType.SIMPLE_POINT"
            [symbology]="layer.symbology">
          </wave-legendary-points>

          <wave-legendary-clustered-points
            *ngSwitchCase="_enumSymbologyType.CLUSTERED_POINT"
            [symbology]="layer.symbology">
          </wave-legendary-clustered-points>

          <wave-legendary-vector
            *ngSwitchCase="_enumSymbologyType.SIMPLE_VECTOR"
            [symbology]="layer.symbology">
          </wave-legendary-vector>

          <wave-legendary-raster
            *ngSwitchCase="_enumSymbologyType.RASTER"
            [symbology]="layer.symbology">
          </wave-legendary-raster>

          <wave-legendary-mapping-colorizer-raster
            *ngSwitchCase="_enumSymbologyType.MAPPING_COLORIZER_RASTER"
            [symbology]="layer.symbology">
          </wave-legendary-mapping-colorizer-raster>

          <wave-legendary *ngSwitchDefault [symbology]="layer.symbology"></wave-legendary>
        </div>
        </div>      
    </md-list-item>

    </template>
  </md-list>
</div>
`,
  viewProviders: [DragulaService],
  styleUrls: ['./layer-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LayerListComponent implements OnDestroy {
    // make visible in template
    // tslint:disable:variable-name
    LoadingState = LoadingState;
    _enumSymbologyType = SymbologyType;
    // tslint:enable

    private subscriptions: Array<Subscription> = [];

    constructor(
        private dragulaService: DragulaService,
        private layerService: LayerService
    ) {
        dragulaService.setOptions('layer-bag', {
            removeOnSpill: false,
            revertOnSpill: true,
        });

        this.handleDragAndDrop();
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    handleDragAndDrop() {
        let dragIndex: number;
        let dropIndex: number;

        this.subscriptions.push(
            this.dragulaService.drag.subscribe((value: [string, HTMLElement, HTMLElement]) => {
                const [_, listItem, list] = value;
                dragIndex = this.domIndexOf(listItem, list);
                // console.log('drag', dragIndex);
            })
        );
        this.subscriptions.push(
            this.dragulaService.drop.subscribe((value: [string, HTMLElement, HTMLElement]) => {
                const [_, listItem, list] = value;
                dropIndex = this.domIndexOf(listItem, list);
                // console.log('drop', dropIndex);

                const layers = this.layerService.getLayers();
                layers.splice(dropIndex, 0, layers.splice(dragIndex, 1)[0]);
                this.layerService.setLayers(layers);
            })
        );
    }

    replaceContextMenu(event: MouseEvent, layer: Layer<Symbology>) {
        // event.preventDefault();
        console.info(`A context menu for ${layer.name} will appear in future versions!`);
    }

    toggleLayer(layer: Layer<Symbology>) {
        this.layerService.toggleLayer(layer);
    }

    private domIndexOf(child: HTMLElement, parent: HTMLElement) {
        return Array.prototype.indexOf.call(parent.children, child);
    }
}
