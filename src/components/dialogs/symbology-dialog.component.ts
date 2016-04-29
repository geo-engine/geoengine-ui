import {Component, ChangeDetectionStrategy, OnInit, Input} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";
import {DialogContainerComponent} from "./dialog-basics.component";

import {LayerService} from "../../services/layer.service";

import {Symbology, SimplePointSymbology} from "../../models/symbology.model";
import {SymbologyPointsComponent} from "./symbology/symbology-points.component";

import {Layer} from "../../models/layer.model";


@Component({
    selector: "wave-layer-symbology-dialog",
    template: `
    <wave-dialog-container [title]="_layer?.name">
        <wave-symbology-points [symbology]="_symbology" (symbologyChanged)="update_symbology($event)">
        </wave-symbology-points>
    </wave-dialog-container>
    `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, DialogContainerComponent, SymbologyPointsComponent],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyDialogComponent implements OnInit {
    @Input() layerService: LayerService;
    private _layer: Layer;
    private _symbology: Symbology;

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
