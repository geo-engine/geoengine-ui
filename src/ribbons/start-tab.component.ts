import {Component, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import Config from '../app/config.model';

import {LayerService} from '../layers/layer.service';
import {MappingQueryService} from '../queries/mapping-query.service';
import {WFSOutputFormats} from '../queries/output-formats/wfs-output-format.model';

import {OperatorGraphDialogComponent} from '../app/layers/dialogs/operator-graph.component';
import {RenameLayerComponent} from '../app/layers/dialogs/rename-layer.component';
import {SymbologyDialogComponent} from '../symbology/symbology-dialog.component';
import {ExportDialogComponent} from '../app/layers/dialogs/export.component';

import {ResultTypes} from '../app/operators/result-type.model';

import {UserService} from '../users/user.service';
import {MdDialog} from '@angular/material';
import {RasterRepositoryComponent} from "../components/raster-repository.component";
import {AbcdRepositoryComponent} from "../components/abcd-repository.component";
import {CsvRepositoryComponent} from "../components/csv-repository.component";
import {GfbioBasketsComponent} from "../baskets/gfbio-baskets.component";
import {OperatorRepositoryComponent} from "../components/operator-repository.component";
import {LayoutService} from "../app/layout.service";

/**
 * The start tab of the ribbons component.
 */
@Component({
    selector: 'wave-start-tab',
    template: `
    <div class="ribbons">

        <!--
        <fieldset [class.selected]="isLayerSelected$ | async">
            <legend>Layer</legend>
            <div class="flex-row">
                <div class="flex-column" style="display: none;">
                    <button md-button style="margin: 0; height: auto;"
                            class="flex-column md-primary" [disabled]="true"
                            layout-align="center center">
                        <md-icon>info</md-icon>
                        <div>Info</div>
                    </button>
                </div>
                <div class="flex-column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="lineageDialog.show()">
                        <md-icon>merge_type</md-icon>
                        Lineage
                    </button>
                    <button md-button
                        style="text-align: left; margin: 0px;"
                        class="md-primary"
                        [disabled]="!(isLayerSelected$ | async)"
                        (click)="exportDialog.show()"
                    >
                        <md-icon>file_download</md-icon>
                        Export
                    </button>
                    <button md-button style="text-align: left; margin: 0px; visibility: hidden;"
                            class="md-primary" [disabled]="true">
                        <md-icon>share</md-icon>
                        Share
                    </button>
                </div>
                <div class="flex-column">
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="dialog.open(RenameLayerComponent)">
                        <md-icon>mode_edit</md-icon>
                        Rename
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                      (click)="symbologyDialog.show()">
                        <md-icon>format_paint</md-icon>
                        Symbology
                    </button>
                    <button md-button style="text-align: left; margin: 0px;"
                            class="md-primary" [disabled]="!(isLayerSelected$ | async)"
                            (click)="removeSelectedLayer()">
                        <md-icon>cancel</md-icon>
                        Remove
                    </button>
                </div>
            </div>
        </fieldset>
        -->

        <fieldset>
            <legend>Zoom</legend>
            <div class="flex-row">
                <!--
                <div class="flex-column">
                
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomLayer.emit()"
                            [disabled]="!(isLayerSelected$ | async)">
                        <md-icon>zoom_in</md-icon>
                        Layer
                    </button>
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomProject.emit()"
                            disabled="true" style="visibility: hidden; margin: 0;">
                        <md-icon>zoom_in</md-icon>
                        Project
                    </button>
                    <button md-button style="text-align: left; margin: 0px;" class="md-primary"
                            (click)="zoomMap.emit()">
                        <md-icon>zoom_out</md-icon>
                        Map
                    </button>
                </div>
                -->
                <div class="flex-column flex_center">
                    <button md-mini-fab md-primary aria-label="Zoom In"
                            (click)="zoomIn.emit()">
                        <md-icon>add</md-icon>
                    </button>
                    <button md-mini-fab md-primary aria-label="Zoom Out"
                            (click)="zoomOut.emit()">
                        <md-icon>remove</md-icon>
                    </button>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Add Data</legend>
            <div class="flex-row">
                <div class="flex-column">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary small"
                            (click)="layoutService.setSidenavContentComponent(RRC)">
                        <md-icon>layers</md-icon>
                       Environmental
                    </button>
                    <button md-button
                        class="md-primary small"
                        (click)="layoutService.setSidenavContentComponent(ARC)"
                    >
                        <md-icon>storage</md-icon>
                        ABCD Archives
                    </button>
                    <button md-button
                        class="md-primary small"
                        (click)="layoutService.setSidenavContentComponent(CSV)"
                    >
                        <md-icon>grid_on</md-icon>
                        CSV Data/Import
                    </button>
                </div>
                <div class="flex-column">
                    <button md-button
                        *ngIf="Config.PROJECT === 'GFBio'
                               && (userService.getUserStream() | async).hasExternalIdPrefix('GFBIO')"
                        class="md-primary small"
                        (click)="layoutService.setSidenavContentComponent(GBC)"
                    >
                        <md-icon>add_shopping_cart</md-icon>
                        GFBio Baskets
                    </button>

                    <button md-button *ngIf="false"
                        class="md-primary small"
                        disabled="true"
                    >
                        <md-icon>file_upload</md-icon>
                        Upload
                    </button>
                    
                    <button md-button
                        class="md-primary small"
                        (click)="gbifLoader.show()"
                    >
                        <md-icon>search</md-icon>
                        Species Distribution
                    </button>
                    <button md-button
                        class="md-primary small"
                        (click)="layoutService.setSidenavContentComponent(ORC)"
                    >
                        <md-icon>sentiment_very_dissatisfied</md-icon>
                        Operators
                    </button>
                    <button md-button
                        *ngIf="false"
                        class="md-primary small"
                        disabled="true"
                    >
                        <md-icon>brush</md-icon>
                        Draw
                    </button>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Reference Time</legend>
            <wave-time-ribbon></wave-time-ribbon>
        </fieldset>

    </div>
    <!--
    <wave-dialog-loader #renameLayerDialog [type]="RenameLayerComponent"></wave-dialog-loader>
    <wave-dialog-loader #symbologyDialog [type]="SymbologyDialogComponent"></wave-dialog-loader>
    <wave-dialog-loader #exportDialog [type]="ExportDialogComponent"></wave-dialog-loader>
    <wave-dialog-loader #lineageDialog
        [type]="OperatorGraphDialogComponent"
        [config]="{selectedLayerOnly: true}"
    ></wave-dialog-loader>
    <wave-dialog-loader #gbifLoader [type]="GBIFOperatorComponent"></wave-dialog-loader>
    -->
    `,
    styles: [`
    .ribbons {
      display: flex;
      flex: 1;
    }    
    .flex-row {
      display: flex;
      flex-direction: row;
      box-sizing: border-box;      
    }
    .flex-column {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;  
    }
    .flex_center {
      align-items: center;
      align-content: center;
      justify-content: space-around;
    }
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
    button[disabled] {
        background-color: transparent;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartTabComponent {
    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    @Output() zoomProject = new EventEmitter<void>();

    @Output() zoomMap = new EventEmitter<void>();

    private RRC = RasterRepositoryComponent; // tslint:disable-line:no-unused-variable variable-name
    private ARC = AbcdRepositoryComponent; // tslint:disable-line:no-unused-variable variable-name
    private CSV = CsvRepositoryComponent; // tslint:disable-line:no-unused-variable variable-name
    private GBC = GfbioBasketsComponent;
    private ORC = OperatorRepositoryComponent;

    // tslint:disable:variable-name
    RenameLayerComponent = RenameLayerComponent;
    SymbologyDialogComponent = SymbologyDialogComponent;
    ExportDialogComponent = ExportDialogComponent;
    OperatorGraphDialogComponent = OperatorGraphDialogComponent;
    Config = Config;
    // tslint:enable

    exportLayerUrl$: Observable<string>;

    private isLayerSelected$: Observable<boolean>;

    constructor(
        public dialog: MdDialog,
        private layerService: LayerService,
        private mappingQueryService: MappingQueryService,
        private userService: UserService,
        private layoutService: LayoutService
    ) {
        this.isLayerSelected$ = this.layerService.getIsAnyLayerSelectedStream();
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
    /* TODO: REMOVE
    removeSelectedLayer() {
        const selectedLayer = this.layerService.getSelectedLayer();
        this.layerService.removeLayer(selectedLayer);
    }
    */
}
