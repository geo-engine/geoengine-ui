import {Component, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {OVERLAY_PROVIDERS} from '@angular2-material/core/overlay/overlay';

import {DefaultBasicDialog} from '../../dialogs/basic-dialog.component';

import {LayerService} from '../../services/layer.service';

import {Layer} from '../../layers/layer.model';
import {Symbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <form>
        <md-input placeholder="Name" [(ngModel)]="layerName"></md-input>
    </form>
    `,
    styles: [`
    form {
        padding-top: 16px;
    }
    `],
    providers: [OVERLAY_PROVIDERS],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    pipes: [],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenameLayerComponent extends DefaultBasicDialog implements OnInit {
    private layer: Layer<Symbology>;
    private layerName: string;

    constructor(
        private layerService: LayerService
    ) {
        super();

        this.layer = this.layerService.getSelectedLayer();
        this.layerName = this.layer.name;
    }

    ngOnInit() {
        this.dialog.setTitle('Rename the Current Layer');
        this.dialog.setButtons([
            { title: 'Cancel', action: () => this.dialog.close() },
            { title: 'Save', class: 'md-primary', action: () => this.save() },
        ]);
    }

    /**
     * Save the layer name and close the dialog.
     */
    save() {
        if (this.layerName !== this.layer.name) {
            this.layerService.changeLayerName(this.layer, this.layerName);
        }
        this.dialog.close();
    }

}
