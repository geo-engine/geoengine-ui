import {Component, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";


/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: "wave-dialog-header",
    template: `
    <md-toolbar class="md-primary">
        <h2 class="md-toolbar-tools">
            <ng-content></ng-content>
        </h2>
    </md-toolbar>
    <div class="placeholder"></div>
    `,
    styles: [`
    md-toolbar {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
    }
    .placeholder {
        height: 48px;
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogHeaderComponent {}
