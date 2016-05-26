import {Component, OnInit, ViewChild} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MdDialog} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../../services/layer.service';

import {Layer} from '../../models/layer.model';
import {Symbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-rename-layer-dialog',
    template: `
    <md-dialog #dialog>
        <md-dialog-title text="Rename the Current Layer"></md-dialog-title>
        <md-input placeholder="Name" [(ngModel)]="layerName"></md-input>
        <md-dialog-actions>
            <button md-button type="button" (click)="dialog.close()">Cancel</button>
            <button md-button class="md-primary" type="button" (click)="save()">Save</button>
        </md-dialog-actions>
    </md-dialog>
    `,
    styles: [`

    `],
    providers: [],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    pipes: [],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenameLayerComponent implements OnInit {
    @ViewChild('dialog') dialog: MdDialog;

    private layer: Layer<Symbology>;
    private layerName: string;

    constructor(
        private layerService: LayerService
    ) {}

    ngOnInit() {
        this.layer = this.layerService.getSelectedLayer();
        if (this.layer) {
            this.layerName = this.layer.name;
        }
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

    /**
     * Display the dialog.
     */
    show() {
        console.log('show it');
        this.dialog.show();
    }

}
