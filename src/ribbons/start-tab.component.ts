import {Component, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {LayerService} from '../layers/layer.service';
import {MappingQueryService, WFSOutputFormats} from '../services/mapping-query.service';

import {TimeRibbonComponent} from './time-ribbon.component';

import {DialogLoaderComponent} from '../dialogs/dialog-loader.component';

import {OperatorGraphDialogComponent} from '../layers/dialogs/operator-graph.component';
import {RenameLayerComponent} from '../layers/dialogs/rename-layer.component';
import {SymbologyDialogComponent} from '../symbology/symbology-dialog.component';
import {GBIFOperatorComponent}  from '../operators/dialogs/gbif.component';

import {ResultTypes} from '../operators/result-type.model';

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
                            class="md-primary" [disabled]="true"
                            layout="column" layout-align="center center">
                        <i md-icon>info</i>
                        <div>Info</div>
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="lineageDialog.show()">
                        <i md-icon>merge_type</i>
                        Lineage
                    </button>
                    <a md-button
                        style="text-align: left; margin: 0px;"
                        class="md-primary"
                        [class.disabled]="!(isLayerSelected$ | async)
                                            || (exportLayerUrl$ | async).length <= 0"
                        [href]="exportLayerUrl$ | async"
                        download
                    >
                        <i md-icon>file_download</i>
                        Export
                    </a>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="true">
                        <i md-icon>share</i>
                        Share
                    </button>
                </div>
                <div layout="column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="renameLayerDialog.show()">
                        <i md-icon>mode_edit</i>
                        Rename
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                      (click)="symbologyDialog.show()">
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
                    <button md-button
                        class="md-primary small"
                        disabled="true"
                    >
                        <i md-icon>add_shopping_cart</i>
                        GFBio Search
                    </button>
                    <button md-button
                        class="md-primary small"
                        disabled="true"
                    >
                        <i md-icon>file_upload</i>
                        Upload
                    </button>
                    <button md-button
                        class="md-primary small"
                        (click)="gbifLoader.show()"
                    >
                        <i md-icon>search</i>
                        GBIF Search
                    </button>
                    <button md-button
                        *ngIf="false"
                        class="md-primary small"
                        disabled="true"
                    >
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
    <wave-dialog-loader #renameLayerDialog [type]="RenameLayerComponent"></wave-dialog-loader>
    <wave-dialog-loader #symbologyDialog [type]="SymbologyDialogComponent"></wave-dialog-loader>
    <wave-dialog-loader #lineageDialog
        [type]="OperatorGraphDialogComponent"
        [config]="{selectedLayerOnly: true}"
    ></wave-dialog-loader>
    <wave-dialog-loader #gbifLoader [type]="GBIFOperatorComponent"></wave-dialog-loader>
    `,
    styles: [`
    .selected {
      background-color: #f5f5f5 !important;
    }
    a.disabled, a.disabled >>> .md-button-wrapper {
        pointer-events: none;
        color: rgba(0, 0, 0, 0.26);
        background-color: transparent;
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
    button.small {
        text-align: left;
        margin: 0px;
    }
    `],
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES, TimeRibbonComponent,
        DialogLoaderComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartTabComponent {
    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    @Output() zoomLayer = new EventEmitter<void>();

    @Output() zoomProject = new EventEmitter<void>();

    @Output() zoomMap = new EventEmitter<void>();

    @Output() addData = new EventEmitter<void>();

    // tslint:disable:variable-name
    RenameLayerComponent = RenameLayerComponent;
    SymbologyDialogComponent = SymbologyDialogComponent;
    OperatorGraphDialogComponent = OperatorGraphDialogComponent;
    GBIFOperatorComponent = GBIFOperatorComponent;
    // tslint:enable

    exportLayerUrl$: Observable<string>;

    private isLayerSelected$: Observable<boolean>;

    constructor(
        private layerService: LayerService,
        private mappingQueryService: MappingQueryService
    ) {
        this.isLayerSelected$ = this.layerService.getSelectedLayerStream()
                                                 .map(layer => layer !== undefined);

        this.exportLayerUrl$ = this.layerService.getSelectedLayerStream().filter(
            layer => layer !== undefined
        ).switchMap(layer => {
            if (ResultTypes.VECTOR_TYPES.indexOf(layer.operator.resultType) >= 0) {
                return this.mappingQueryService.getWFSQueryUrlStream(
                    layer.operator, WFSOutputFormats.CSV_ZIP
                );
            } else {
                return Observable.of('');
            }
        });
    }

    // /**
    //  * Show lineage information for the selected layer.
    //  */
    // showLineage() {
    //     const config = new OperatorGraphDialogConfig()
    //         .layerService(this.layerService)
    //         .selectedLayerOnly(true)
    //         .clickOutsideToClose(true);
    //
    //     this.mdDialog.open(OperatorGraphDialogComponent, this.elementRef, config);
    // }
    //
    // /**
    //  * Show rename dialog for the selected layer.
    //  */
    // showRenameLayerDialog(event: Event) {
    //     const config = new RenameLayerDialogConfig()
    //         .layerService(this.layerService)
    //         .clickOutsideToClose(true)
    //         .targetEvent(event);
    //
    //     this.mdDialog.open(RenameLayerComponent, this.elementRef, config);
    // }
    //
    // /**
    //  * Show symbology dialog for the selected layer.
    //  */
    // showSymbologyDialog(event: Event) {
    //     const config = new SymbologyDialogConfig()
    //       .layerService(this.layerService)
    //       .clickOutsideToClose(true)
    //       .targetEvent(event);
    //
    //     this.mdDialog.open(SymbologyDialogComponent, this.elementRef, config);
    // }

    /**
     * Remove the selected layer from the list.
     */
    removeSelectedLayer() {
        const selectedLayer = this.layerService.getSelectedLayer();
        this.layerService.removeLayer(selectedLayer);
    }
}
