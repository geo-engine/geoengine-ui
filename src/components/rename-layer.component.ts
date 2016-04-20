import {Component, ChangeDetectionStrategy, Input, OnInit} from "angular2/core";
import {COMMON_DIRECTIVES} from "angular2/common";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";

import {LayerService} from "../services/layer.service";

import {Layer} from "../models/layer.model";

@Component({
    selector: "wave-rename-layer",
    template: `
    <h2 class="md-title">Rename the Current Layer</h2>
    <br>
    <md-input-container class="md-block">
        <label>Name</label>
        <input md-input [(value)]="layerName">
    </md-input-container>
    <md-dialog-actions>
        <button md-button type="button" (click)="dialog.close()">
            <span>Cancel</span>
        </button>
        <button md-button class="md-primary" type="button" (click)="save()">
            <span>Save</span>
        </button>
    </md-dialog-actions>
    `,
    styles: [`

    `],
    providers: [],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES],
    pipes: [],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenameLayerComponent implements OnInit {
    @Input() title: string = "";
    @Input() textContent: string = "";
    @Input() cancel: string = "";
    @Input() ok: string = "";
    @Input() type: string = "alert";

    @Input() layerService: LayerService;

    private layer: Layer;
    private layerName: string;

    constructor(private dialog: MdDialogRef) {}

    ngOnInit() {
        this.layer = this.layerService.getSelectedLayer();
        this.layerName = this.layer.name;
    }

    save() {
        if (this.layerName !== this.layer.name) {
            this.layerService.changeLayerName(this.layer, this.layerName);
        }
        this.dialog.close();
    }

}

export class RenameLayerDialogConfig extends MdDialogConfig {
    layerService(layerService: LayerService): RenameLayerDialogConfig {
        this.context.layerService = layerService;
        return this;
    }
}
