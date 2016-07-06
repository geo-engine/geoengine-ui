import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

import Config from '../app/config.model';

import {SymbologyType, Symbology} from '../symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {LoadingState} from '../shared/loading-state.model';

import {LayerService} from '../layers/layer.service';
import {
    LegendaryRasterComponent, LegendaryPointComponent, LegendaryVectorComponent,
    LegendaryMappingColorizerRasterComponent, LegendaryClusteredPointComponent,
} from '../symbology/legendary.component';

@Component({
    selector: 'wave-layer-list',
    template: `
    <md-content flex>
    <md-list [dragula]="layer-bag">
        <md-list-item
            *ngIf="(layerService.getLayersStream() | async).length === 0"
            class="no-layer"
        >no layer available</md-list-item>
        <md-list-item md-ink
            *ngFor="let layer of layerService.getLayersStream() | async; let index = index"
            (click)="layerService.setSelectedLayer(layer)"
            [class.md-active]="layer === (layerService.getSelectedLayerStream() | async)"
            (contextmenu)="replaceContextMenu($event, layer)"
            [title]="layer.name"
        >
            <div layout="column">
                <div layout="row">
                    <button md-button class="md-icon-button"
                            style="margin-left: -16px;"
                            aria-label="Settings"
                            (click)="toggleLayer(layer)">
                        <i *ngIf="!layer.expanded" md-icon>expand_more</i>
                        <i *ngIf="layer.expanded" md-icon>expand_less</i>
                    </button>

                    <div #layerName class="md-list-item-text" style="padding-top: 10px">
                        {{layer.name}}
                    </div>

                    <button md-button class="md-icon-button"
                            style="margin-right: -16px; visibility: hidden;"
                            aria-label="More"
                            *ngIf="layer === (layerService.getSelectedLayerStream() | async)"
                            (click)="replaceContextMenu($event, layer)"
                            disabled="true"
                    >
                        <i md-icon>more_vert</i>
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
                        <i md-icon>replay</i>
                    </button>
                </div>
                <div *ngIf="layer.expanded" [ngSwitch]="layer.symbology.symbologyType">

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
            <md-divider
                [class.md-active]="layer === (layerService.getSelectedLayerStream() | async)">
            </md-divider>
        </md-list-item>
    </md-list>
    </md-content>
    `,
    styles: [`
    :host {
        display: block;
    }
    .no-layer {
        height: 24px;
        min-height: 24px;
        cursor: auto;
    }
    .no-layer >>> .md-list-item-inner {
        height: 24px;
        min-height: 24px;
        color: ${Config.COLORS.TEXT.DEFAULT};
        opacity: 0.5;
        justify-content: center;
        font-style: oblique;
    }
    .md-active {
        background: ${Config.COLORS.DEFAULT};
    }
    md-divider.md-active {
        border-top-color: ${Config.COLORS.PRIMARY};
    }
    md-list-item {
        cursor: pointer;
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
    button[disabled] {
        background-color: transparent;
    }
    md-progress-circle {
        position: absolute;
        height: 36px !important;
        width: 36px !important;
        left: calc(50% - 36px/2);
        top: 6px;
    }
    button.error-button {
        position: absolute;
        left: calc(50% - 40px/2);
    }
    `],
    viewProviders: [DragulaService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES, Dragula,
        LegendaryPointComponent, LegendaryRasterComponent, LegendaryVectorComponent,
        LegendaryMappingColorizerRasterComponent, LegendaryClusteredPointComponent,
    ],
})

export class LayerListComponent {
    // make visible in template
    // tslint:disable:variable-name
    LoadingState = LoadingState;
    _enumSymbologyType = SymbologyType;
    // tslint:enable

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

    handleDragAndDrop() {
        let dragIndex: number;
        let dropIndex: number;

        this.dragulaService.drag.subscribe((value: [string, HTMLElement, HTMLElement]) => {
            const [_, listItem, list] = value;
            dragIndex = this.domIndexOf(listItem, list);
            // console.log('drag', dragIndex);
        });
        this.dragulaService.drop.subscribe((value: [string, HTMLElement, HTMLElement]) => {
            const [_, listItem, list] = value;
            dropIndex = this.domIndexOf(listItem, list);
            // console.log('drop', dropIndex);

            const layers = this.layerService.getLayers();
            layers.splice(dropIndex, 0, layers.splice(dragIndex, 1)[0]);
            this.layerService.setLayers(layers);
        });
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
