import {Component, ChangeDetectionStrategy, OnInit, Input} from "angular2/core";

import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";
import {DialogContainerComponent} from "./dialog-basics.component";

import {LayerService} from "../../services/layer.service";

import {Layer} from "../../models/layer.model";
import {Operator} from "../../models/operator.model";

import dagre from "dagre";

@Component({
    selector: "wave-operator-graph-dialog",
    template: `
    <wave-dialog-container [title]="title">

    </wave-dialog-container>
    `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, DialogContainerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorGraphDialogComponent implements OnInit {
    @Input() layerService: LayerService;
    @Input() selectedLayerOnly: boolean;

    constructor(private dialog: MdDialogRef) {}

    ngOnInit() {
        if (this.selectedLayerOnly) {
            let layer = this.layerService.getSelectedLayer();

            let graph = new dagre.graphlib.Graph();

            let operators: Array<Operator> = [layer.operator];

        } else {
            // TODO: implement?
        }
    }
}
