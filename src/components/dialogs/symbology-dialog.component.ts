import {Component, ChangeDetectionStrategy, OnInit, Input} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";
import {DialogContainerComponent} from "./dialog-basics.component";

import {LayerService} from "../../services/layer.service";

import {Symbology, SimplePointSymbology, RasterSymbology} from "../../models/symbology.model";
import {SymbologyRasterComponent} from "./symbology/symbology-raster.component";
import {SymbologyPointsComponent} from "./symbology/symbology-points.component";

import {Layer} from "../../models/layer.model";
import {ResultType} from "../../models/operator.model";


@Component({
    selector: "wave-layer-symbology-dialog",
    template: `
    <wave-dialog-container [title]="_layer?.name" >
        <div [ngSwitch]="_layer.resultType">
            <wave-symbology-points *ngSwitchWhen="enumResultType.POINTS" [symbology]="_symbology" (symbologyChanged)="update_symbology($event)"></wave-symbology-points>
            <wave-symbology-raster *ngSwitchWhen="enumResultType.RASTER" [symbology]="_symbology" (symbologyChanged)="update_symbology($event)"></wave-symbology-raster>
        </div>
    </wave-dialog-container>
    `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, DialogContainerComponent, SymbologyPointsComponent, SymbologyRasterComponent],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyDialogComponent implements OnInit {
    @Input() layerService: LayerService;
    private _layer: Layer;
    private _symbology: Symbology;

    // for ng-switch
    public enumResultType = ResultType;

    constructor(private dialog: MdDialogRef) {}

    ngOnInit() {
            this._layer = this.layerService.getSelectedLayer();
            console.log("layer symbology", this._layer);
            this._symbology = this._layer.symbology.clone();
    }

    update_symbology(symbology: Symbology) {
        console.log("symbology", symbology);
        this.layerService.changeLayerSymbology(this._layer, symbology);
    }
}

export class SymbologyDialogConfig extends MdDialogConfig {
    layerService(layerService: LayerService): SymbologyDialogConfig {
        this.context.layerService = layerService;
        return this;
    }
}
