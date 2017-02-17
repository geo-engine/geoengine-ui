import {Component, OnInit} from '@angular/core';

import {LayerService} from '../layers/layer.service';

import {Symbology, SymbologyType} from './symbology.model';

import {Layer} from '../layers/layer.model';

@Component({
    selector: 'wave-layer-symbology-dialog',
    template: `
    <wave-dialog-container [title]='_layer?.name' >
        <div class='symbologyContainer' [ngSwitch]='_symbology.getSymbologyType()'>
            <wave-symbology-points
                *ngSwitchCase='enumSymbologyType.SIMPLE_POINT'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-points>
            <wave-symbology-points
                *ngSwitchCase='enumSymbologyType.CLUSTERED_POINT'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-points>
            <wave-symbology-vector
                *ngSwitchCase='enumSymbologyType.SIMPLE_VECTOR'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-vector>
            <wave-symbology-raster
                *ngSwitchCase='enumSymbologyType.RASTER'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-raster>
            <wave-symbology-raster
                *ngSwitchCase='enumSymbologyType.MAPPING_COLORIZER_RASTER'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-raster>
        </div>
    </wave-dialog-container>
    `,
    styles: [`
        .symbologyContainer {
            min-height: 400px;
            min-width: 20px;
        }
    `],
})
export class SymbologyDialogComponent implements OnInit {
    // for ng-switch
    public enumSymbologyType = SymbologyType;

    private _layer: Layer<Symbology>;
    private _symbology: Symbology;

    constructor(
        private layerService: LayerService
    ) {
        // super();

        this._layer = this.layerService.getSelectedLayer();
        this._symbology = this._layer.symbology.clone();
    }

    ngOnInit() {
        // this.dialog.setTitle('Change the Symbology of the current Layer');
        // this.dialog.setButtons([
        //     { title: 'Close', action: () => this.dialog.close() },
        // ]);
    }

    update_symbology(symbology: Symbology) {
        this.layerService.changeLayerSymbology(this._layer, symbology);
    }
}
