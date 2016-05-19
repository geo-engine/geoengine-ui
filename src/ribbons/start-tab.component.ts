import {Component, Output, EventEmitter, ChangeDetectionStrategy, ElementRef} from 'angular2/core';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES, MdDialog} from 'ng2-material/all';

import {LayerService} from '../services/layer.service';

import {TimeRibbonComponent} from './time-ribbon.component';

import {OperatorGraphDialogComponent, OperatorGraphDialogConfig}
  from '../components/dialogs/operator-graph.component';
import {RenameLayerComponent, RenameLayerDialogConfig}
  from '../components/rename-layer.component';
import {SymbologyDialogComponent, SymbologyDialogConfig}
  from '../components/dialogs/symbology-dialog.component';

/**
 * The start tab of the ribbons component.
 */
@Component({
    selector: 'wave-start-tab',
    template: `
    <md-content layout="row">

        <fieldset [class.selected]="isLayerSelected$ | async">
            <legend>Layer</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            layout="column" layout-align="center center">
                        <i md-icon>info</i>
                        <div>Info</div>
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="showLineage()">
                        <i md-icon>merge_type</i>
                        Lineage
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)">
                        <i md-icon>file_download</i>
                        Export
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)">
                        <i md-icon>share</i>
                        Share
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="showRenameLayerDialog($event)">
                        <i md-icon>mode_edit</i>
                        Rename
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                      (click)="showSymbologyDialog($event)">
                        <i md-icon>map</i>
                        Symbology
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="removeSelectedLayer()">
                        <i md-icon>cancel</i>
                        Remove
                    </button>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Zoom</legend>
            <div layout="row">
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomLayer.emit()"
                            [disabled]="!(isLayerSelected$ | async)">
                        <i md-icon>zoom_in</i>
                        Layer
                    </button>
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomProject.emit()"
                            disabled="true">
                        <i md-icon>zoom_in</i>
                        Project
                    </button>
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomMap.emit()">
                        <i md-icon>zoom_out</i>
                        Map
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-fab class="md-mini md-primary" aria-label="Zoom In"
                            (click)="zoomIn.emit()">
                        <i md-icon>add</i>
                    </button>
                    <button md-fab class="md-mini md-primary" aria-label="Zoom Out"
                            (click)="zoomOut.emit()">
                        <i md-icon>remove</i>
                    </button>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Add Data</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="addData.emit()">
                        <i md-icon>storage</i>
                        <div>Repository</div>
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary">
                        <i md-icon>add_shopping_cart</i>
                        GFBio Search
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary">
                        <i md-icon>file_upload</i>
                        Upload
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary">
                        <i md-icon>brush</i>
                        Draw
                    </button>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Reference Time</legend>
            <wave-time-ribbon></wave-time-ribbon>
        </fieldset>

    </md-content>
    `,
    styles: [`
    .selected {
      background-color: #f5f5f5 !important;
    }
    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
    }
    button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [MATERIAL_DIRECTIVES, TimeRibbonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartTabComponent {
    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    @Output() zoomLayer = new EventEmitter<void>();

    @Output() zoomProject = new EventEmitter<void>();

    @Output() zoomMap = new EventEmitter<void>();

    @Output() addData = new EventEmitter<void>();

    private isLayerSelected$: Observable<boolean>;

    constructor(
        private elementRef: ElementRef,
        private mdDialog: MdDialog,
        private layerService: LayerService
    ) {
        this.isLayerSelected$ = this.layerService.getSelectedLayerStream()
                                                 .map(layer => layer !== undefined);
    }

    /**
     * Show lineage information for the selected layer.
     */
    showLineage() {
        const config = new OperatorGraphDialogConfig()
            .layerService(this.layerService)
            .selectedLayerOnly(true)
            .clickOutsideToClose(true);

        this.mdDialog.open(OperatorGraphDialogComponent, this.elementRef, config);
    }

    /**
     * Show rename dialog for the selected layer.
     */
    showRenameLayerDialog(event: Event) {
        const config = new RenameLayerDialogConfig()
            .layerService(this.layerService)
            .clickOutsideToClose(true)
            .targetEvent(event);

        this.mdDialog.open(RenameLayerComponent, this.elementRef, config);
    }

    /**
     * Show symbology dialog for the selected layer.
     */
    showSymbologyDialog(event: Event) {
        const config = new SymbologyDialogConfig()
          .layerService(this.layerService)
          .clickOutsideToClose(true)
          .targetEvent(event);

        this.mdDialog.open(SymbologyDialogComponent, this.elementRef, config);
    }

    /**
     * Remove the selected layer from the list.
     */
    removeSelectedLayer() {
        const selectedLayer = this.layerService.getSelectedLayer();
        this.layerService.removeLayer(selectedLayer);
    }
}
