import {Component, OnInit} from '@angular/core';

import {LayerService} from '../layers/layer.service';

import {Symbology, SymbologyType} from './symbology.model';

import {Layer} from '../layers/layer.model';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-layer-symbology-dialog',
    template: `
    <wave-dialog-header>{{_layer?.name}}</wave-dialog-header>
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
    
    `,
    styles: [`
        .symbologyContainer {
            min-height: 400px;
            min-width: 20px;
        }
    `],
})
export class SymbologyDialogComponent implements OnInit {
    ngOnInit(): void {
    }
    // for ng-switch
    public enumSymbologyType = SymbologyType;

    private _layer: Layer<Symbology>;
    private _symbology: Symbology;

    constructor(
        private layerService: LayerService,
        private dialogRef: MdDialogRef<SymbologyDialogComponent>
    ) {
        this._layer = this.layerService.getSelectedLayer();
        this._symbology = this._layer.symbology.clone();
    }

    update_symbology(symbology: Symbology) {
        this.layerService.changeLayerSymbology(this._layer, symbology);
    }
}
