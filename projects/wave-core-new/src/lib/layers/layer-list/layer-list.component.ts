import {Observable, Subscription} from 'rxjs';
import {Component, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {IconStyle, Symbology, SymbologyType} from '../symbology/symbology.model';
import {RenameLayerComponent} from '../rename-layer/rename-layer.component';
import {LoadingState} from '../../project/loading-state.model';
import {MapService} from '../../map/map.service';
import {Layer, RasterLayer, VectorLayer} from '../layer.model';
import {ProjectService} from '../../project/project.service';
import {Config} from '../../config.service';
import {last, map, startWith} from 'rxjs/operators';
import {AddDataComponent} from '../../datasets/add-data/add-data.component';
import {LineageGraphComponent} from '../../provenance/lineage-graph/lineage-graph.component';
import {TabsService} from '../../tabs/tabs.service';
import {DataTableComponent} from '../../datatable/table/table.component';
import {Measurement} from '../measurement';
import {RasterLayerMetadata} from '../layer-metadata.model';
import {RasterSymbologyEditorComponent} from '../symbology/raster-symbology-editor/raster-symbology-editor.component';
import {SimpleChanges} from '@angular/core';

/**
 * The layer list component displays active layers, legends and other controlls.
 */
@Component({
    selector: 'wave-layer-list',
    templateUrl: './layer-list.component.html',
    styleUrls: ['./layer-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListComponent implements OnDestroy, OnChanges {
    /**
     * The desired height of the list
     */
    @Input() height?: number;

    /**
     * The empty list shows a button to trigger the generation of a first layer.
     * This sidenav config is called to present a date listing or a similar dialog in the sidenav.
     */
    @Input() addAFirstLayerSidenavConfig: SidenavConfig = {component: AddDataComponent};

    /**
     * sends if the layerlist should be visible
     */
    readonly layerListVisibility$: Observable<boolean>;

    /**
     * sends if the map should be a grid (or else a single map)
     */
    readonly mapIsGrid$: Observable<boolean>;

    maxHeight = 0;

    /**
     * The list of layers displayed in the layer list
     */
    layerList: Array<Layer> = [];

    // make ENUMS and classes visible in the template
    readonly LayoutService = LayoutService;
    readonly ST = SymbologyType;
    readonly LoadingState = LoadingState;
    readonly RenameLayerComponent = RenameLayerComponent;
    readonly LineageGraphComponent = LineageGraphComponent;
    // readonly LayerExportComponent = LayerExportComponent;
    // readonly LayerShareComponent = LayerShareComponent;
    // readonly SourceOperatorListComponent = SourceOperatorListComponent;
    // readonly SymbologyEditorComponent = SymbologyEditorComponent;

    // inventory of used subscriptions
    private subscriptions: Array<Subscription> = [];

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
    ) {
        this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();

        this.subscriptions.push(
            this.projectService.getLayerStream().subscribe((layerList) => {
                if (layerList !== this.layerList) {
                    this.layerList = layerList;
                }
                this.changeDetectorRef.markForCheck();
            }),
        );

        this.mapIsGrid$ = this.mapService.isGrid$;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.height && this.height) {
            this.maxHeight = this.height - LayoutService.getToolbarHeightPx();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    /**
     * the drop method is used by the dran and drop feature of the list
     */
    drop(event: CdkDragDrop<string[]>): void {
        const layerList = this.layerList.slice(); // make a copy to not modify the current list
        moveItemInArray(layerList, event.previousIndex, event.currentIndex);

        this.layerList = layerList; // change in advance to remove flickering
        this.projectService.setLayers(layerList);
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
            // TODO: call vector symbology editor
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
}
