import {Component, ChangeDetectionStrategy, Input} from "angular2/core";
import {COMMON_DIRECTIVES} from "angular2/common";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";

import {LayerService} from "../services/layer.service";

import {Layer} from "../layer.model";

@Component({
    selector: "wave-rename-layer",
    template: `
    <h2 class="md-title">{{ title }}</h2>
    <p>{{ textContent }}</p>
    <br>
    <md-input-container class="md-block" flex-gt-sm>
      <label>Name</label>
      <input md-input [(value)]="layerName">
    </md-input-container>
    <md-dialog-actions>
      <button md-button *ngIf="cancel != ''" type="button" (click)="dialog.close(false, layerName)">
        <span>{{ cancel }}</span>
      </button>
      <button md-button *ngIf="ok != ''" class="md-primary" type="button" (click)="dialog.close(true, layerName)">
        <span>{{ ok }}</span>
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
export class RenameLayerComponent {
  @Input() title: string = "";
  @Input() textContent: string = "";
  @Input() cancel: string = "";
  @Input() ok: string = "";
  @Input() type: string = "alert";

  @Input()
  layerName: string;

  constructor(private dialog: MdDialogRef) {}

}

export class RenameLayerDialogConfig extends MdDialogConfig {
  layer(layer: Layer): RenameLayerDialogConfig {
    this.context.Layer = layer;
    return this;
  }

  layerName(layerName: string): RenameLayerDialogConfig {
    this.context.layerName = layerName;
    return this;
  }

  setHeight(height: string): RenameLayerDialogConfig {
    this.height = height;
    return this;
  }
}
