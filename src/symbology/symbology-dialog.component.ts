import {Component, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {OVERLAY_PROVIDERS} from '@angular2-material/core/overlay/overlay';

// import {MdDialogRef, MdDialogConfig} from 'ng2-material/components/dialog/dialog';
import {BasicDialog} from '../dialogs/basic-dialog.component';

import {LayerService} from '../services/layer.service';

import {Symbology, SimplePointSymbology, RasterSymbology, SymbologyType} from './symbology.model';
import {SymbologyRasterComponent} from './symbology-raster.component';
import {SymbologyPointsComponent, SymbologyVectorComponent} from './symbology-points.component';

import {Layer} from '../models/layer.model';

@Component({
    selector: 'wave-layer-symbology-dialog',
    template: `
    <wave-dialog-container [title]='_layer?.name' >
        <div [ngSwitch]='_symbology.symbologyType'>
            <wave-symbology-points
                *ngSwitchWhen='enumSymbologyType.SIMPLE_POINT'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-points>
            <wave-symbology-vector
                *ngSwitchWhen='enumSymbologyType.SIMPLE_VECTOR'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-vector>
            <wave-symbology-raster
                *ngSwitchWhen='enumSymbologyType.RASTER'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-raster>
            <wave-symbology-raster
                *ngSwitchWhen='enumSymbologyType.MAPPING_COLORIZER_RASTER'
                [symbology]='_symbology'
                (symbologyChanged)='update_symbology($event)'>
            </wave-symbology-raster>
        </div>
    </wave-dialog-container>
    `,
    styles: [``],
    providers: [OVERLAY_PROVIDERS],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES,
        SymbologyPointsComponent, SymbologyRasterComponent, SymbologyVectorComponent],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyDialogComponent extends BasicDialog implements OnInit {
    title = 'Change the Symbology of the current Layer';
    buttons = [
        { title: 'Close', action: () => this.dialog.close() },
    ];
    // for ng-switch
    public enumSymbologyType = SymbologyType;

    private _layer: Layer<Symbology>;
    private _symbology: Symbology;

    constructor(
        private layerService: LayerService
    ) {
        super();
    }

    ngOnInit() {
            this._layer = this.layerService.getSelectedLayer();
            this._symbology = this._layer.symbology.clone();
    }

    update_symbology(symbology: Symbology) {
        this.layerService.changeLayerSymbology(this._layer, symbology);
    }
}
