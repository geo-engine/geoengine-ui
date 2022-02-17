import {Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, Input} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatDialog} from '@angular/material/dialog';
import {Layer, RasterLayer, VectorLayer} from '../../layer.model';
import {TabsService} from '../../../tabs/tabs.service';
import {Config} from '../../../config.service';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {LayoutService} from '../../../layout.service';
import {last, map, Observable, startWith} from 'rxjs';
import {IconStyle, Symbology, SymbologyType} from '../../symbology/symbology.model';
import {ProvenanceTableComponent} from '../../../provenance/table/provenance-table.component';
import {DataTableComponent} from '../../../datatable/table/table.component';
import {RasterSymbologyEditorComponent} from '../../symbology/raster-symbology-editor/raster-symbology-editor.component';
import {VectorSymbologyEditorComponent} from '../../symbology/vector-symbology-editor/vector-symbology-editor.component';
import {Measurement} from '../../measurement';
import {RasterLayerMetadata} from '../../layer-metadata.model';
import {NotificationService} from '../../../notification.service';
import {RenameLayerComponent} from '../../rename-layer/rename-layer.component';
import {LineageGraphComponent} from '../../../provenance/lineage-graph/lineage-graph.component';
import {LoadingState} from '../../../project/loading-state.model';
/**
 * The layer list component displays active layers, legends and other controlls.
 */
@Component({
    selector: 'wave-layer-list-element',
    templateUrl: './layer-list-element.component.html',
    styleUrls: ['./layer-list-element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListElementComponent implements OnDestroy, OnChanges {
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
     * The component constructor. It injects angular and wave services.
     */
    constructor(
        public dialog: MatDialog,
        public layoutService: LayoutService,
        public projectService: ProjectService,
        public mapService: MapService,
        public config: Config,
        public changeDetectorRef: ChangeDetectorRef,
        protected readonly tabsService: TabsService,
        protected readonly clipboard: Clipboard,
        protected readonly notificationService: NotificationService,
    ) {}

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnDestroy(): void {
        // this.subscriptions.forEach((s) => s.unsubscribe());
    }

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
            map(() => {}),
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
            map(() => {}),
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
        if (layer instanceof RasterLayer) {
            this.layoutService.setSidenavContentComponent({component: RasterSymbologyEditorComponent, config: {layer}});
        } else if (layer instanceof VectorLayer) {
            this.layoutService.setSidenavContentComponent({component: VectorSymbologyEditorComponent, config: {layer}});
        } else {
            throw Error(`unknown layer type: ${layer.layerType}`);
        }
    }

    getMeasurement(layer: Layer): Observable<Measurement> {
        return this.projectService.getLayerMetadata(layer).pipe(
            map((metaData) => metaData as RasterLayerMetadata),
            map((metaData) => metaData.measurement),
        );
    }

    copyWorkflowIdToClipboard(layer: Layer): void {
        this.clipboard.copy(layer.workflowId);
        this.notificationService.info('Copied workflow id to clipboard');
    }
}
