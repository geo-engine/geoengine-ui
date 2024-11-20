import {Component, ChangeDetectionStrategy, ChangeDetectorRef, Input} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatDialog} from '@angular/material/dialog';
import {TabsService} from '../../../tabs/tabs.service';
import {CoreConfig} from '../../../config.service';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {LayoutService} from '../../../layout.service';
import {last, map, mergeMap, Observable, startWith, tap} from 'rxjs';
import {ProvenanceTableComponent} from '../../../provenance/table/provenance-table.component';
import {DataTableComponent} from '../../../datatable/table/table.component';
import {NotificationService} from '../../../notification.service';
import {RenameLayerComponent} from '../../rename-layer/rename-layer.component';
import {LineageGraphComponent} from '../../../provenance/lineage-graph/lineage-graph.component';
import {LoadingState} from '../../../project/loading-state.model';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';
import {HttpEventType} from '@angular/common/http';
import {filenameFromHttpHeaders} from '../../../util/http';
import {IconStyle, Layer, RasterLayerMetadata, RasterSymbology, Symbology, SymbologyType} from '@geoengine/common';
import {RasterBandDescriptor} from '@geoengine/openapi-client';
import {SymbologyEditorComponent} from '../../symbology/symbology-editor/symbology-editor.component';
import {DownloadLayerComponent} from '../../../download-layer/download-layer.component';
/**
 * The layer list component displays active layers, legends and other controlls.
 */
@Component({
    selector: 'geoengine-layer-list-element',
    templateUrl: './layer-list-element.component.html',
    styleUrls: ['./layer-list-element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListElementComponent {
    @Input()
    layer!: Layer;

    @Input()
    menu = true;

    readonly LayoutService = LayoutService;
    readonly ST = SymbologyType;
    readonly LoadingState = LoadingState;
    readonly RenameLayerComponent = RenameLayerComponent;
    readonly LineageGraphComponent = LineageGraphComponent;

    /**
     * The component constructor. It injects angular and geoengine services.
     */
    constructor(
        public readonly dialog: MatDialog,
        public readonly layoutService: LayoutService,
        public readonly projectService: ProjectService,
        public readonly mapService: MapService,
        public readonly config: CoreConfig,
        public readonly changeDetectorRef: ChangeDetectorRef,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly tabsService: TabsService,
        protected readonly clipboard: Clipboard,
        protected readonly notificationService: NotificationService,
    ) {}

    /**
     * select a layer
     */
    toggleLegend(layer: Layer): void {
        this.projectService.toggleLegend(layer);
    }

    /**
     * method to get the symbology stream of a layer. This is used by the icons and legend components.
     */
    getLayerSymbologyStream(layer: Layer): Observable<Symbology> {
        return this.projectService.getLayerChangesStream(layer).pipe(map(() => layer.symbology));
    }

    getIconStyleStream(layer: Layer): Observable<IconStyle> {
        return this.projectService.getLayerChangesStream(layer).pipe(
            startWith(layer),
            map((l) => l.symbology.getIconStyle()),
        );
    }

    /**
     * helper method to cast AbstractSymbology to VectorSymbology
     */
    vectorLayerCast(layer: Layer): Layer {
        return layer as Layer;
    }

    showChannelParameterSlider(_layer: Layer): boolean {
        // return layer.operator.operatorType.toString() === 'GDAL Source'
        //     && !!layer.operator.operatorTypeParameterOptions
        //     && layer.operator.operatorTypeParameterOptions.getParameterOption('channelConfig').hasTicks();

        // TODO: re-implement
        return false;
    }

    showProvenance(layer: Layer): void {
        const name = this.projectService.getLayerChangesStream(layer).pipe(map((l) => 'Provenance of ' + l.name));
        const removeTrigger = this.projectService.getLayerChangesStream(layer).pipe(
            last(),
            map(() => undefined),
        );
        this.tabsService.addComponent({
            name,
            component: ProvenanceTableComponent,
            inputs: {layer},
            equals: (a, b): boolean => a.layer.id === b.layer.id,
            removeTrigger,
        });
    }

    showDatatable(layer: Layer): void {
        const name = this.projectService.getLayerChangesStream(layer).pipe(map((l) => l.name));
        const removeTrigger = this.projectService.getLayerChangesStream(layer).pipe(
            last(),
            map(() => undefined),
        );
        this.tabsService.addComponent({
            name,
            component: DataTableComponent,
            inputs: {layer},
            equals: (a, b): boolean => a.layer.id === b.layer.id,
            removeTrigger,
        });
    }

    showSymbologyEditor(layer: Layer): void {
        this.layoutService.setSidenavContentComponent({component: SymbologyEditorComponent, config: {layer}});
    }

    getBands(layer: Layer): Observable<Array<RasterBandDescriptor>> {
        return this.projectService.getLayerMetadata(layer).pipe(
            map((metaData) => metaData as RasterLayerMetadata),
            map((metaData) => metaData.bands),
        );
    }

    copyWorkflowIdToClipboard(layer: Layer): void {
        this.clipboard.copy(layer.workflowId);
        this.notificationService.info('Copied workflow id to clipboard');
    }

    downloadMetadata(layer: Layer): void {
        this.notificationService.info(`Downloading metadata for layer ${layer.name}`);

        this.userService
            .getSessionTokenForRequest()
            .pipe(
                mergeMap((token) => this.backend.downloadWorkflowMetadata(layer.workflowId, token)),
                tap((event) => {
                    if (event.type !== HttpEventType.DownloadProgress) {
                        return;
                    }

                    const fraction = event.total ? event.loaded / event.total : 1;
                    this.notificationService.info(`Metadata download: ${100 * fraction}%`);
                }),
                last(),
            )
            .subscribe({
                next: (event) => {
                    if (event.type !== HttpEventType.Response || event.body === null) {
                        return;
                    }

                    const zipArchive = new File([event.body], filenameFromHttpHeaders(event.headers) ?? 'metadata.zip');
                    const url = window.URL.createObjectURL(zipArchive);

                    // trigger download
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = zipArchive.name;
                    anchor.click();
                },
                error: (error) => {
                    this.notificationService.error(`File download failed: ${error.message}`);
                },
            });
    }

    showDownload(layer: Layer): void {
        this.layoutService.setSidenavContentComponent({component: DownloadLayerComponent, config: {layer}});
    }

    rasterSymbology(layer: Layer): RasterSymbology {
        return layer.symbology as RasterSymbology;
    }
}
