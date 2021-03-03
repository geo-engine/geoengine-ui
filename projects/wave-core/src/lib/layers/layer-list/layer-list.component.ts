import {Observable, Subscription} from 'rxjs';
import {Component, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {SymbologyType, AbstractSymbology, VectorSymbology} from '../symbology/symbology.model';
import {RenameLayerComponent} from '../dialogs/rename-layer.component';
import {LoadingState} from '../../project/loading-state.model';
import {LayerService} from '../layer.service';
import {MapService} from '../../map/map.service';
import {Layer} from '../layer.model';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {LineageGraphComponent} from '../../provenance/lineage-graph/lineage-graph.component';
import {LayerExportComponent} from '../dialogs/layer-export/layer-export.component';
import {ProjectService} from '../../project/project.service';
import {LayerShareComponent} from '../dialogs/layer-share/layer-share.component';
import {Config} from '../../config.service';
import {SymbologyEditorComponent} from '../symbology/symbology-editor/symbology-editor.component';
import {filter, map, startWith} from 'rxjs/operators';

/**
 * The layer list component displays active layers, legends and other controlls.
 */
@Component({
    selector: 'wave-layer-list',
    templateUrl: './layer-list.component.html',
    styleUrls: ['./layer-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListComponent implements OnDestroy {
    /**
     * The desired height of the list
     */
    @Input() height: number;

    /**
     * The empty list shows a button to trigger the generation of a first layer.
     * This sidenav config is called to present a date listing or a similar dialog in the sidenav.
     */
    @Input() addAFirstLayerSidenavConfig: SidenavConfig = {component: SourceOperatorListComponent};

    /**
     * sends if the layerlist should be visible
     */
    readonly layerListVisibility$: Observable<boolean>;

    /**
     * sends if the map should be a grid (or else a single map)
     */
    readonly mapIsGrid$: Observable<boolean>;

    /**
     * The list of layers displayed in the layer list
     */
    layerList: Array<Layer<AbstractSymbology>> = [];

    // make ENUMS and classes visible in the template
    readonly LayoutService = LayoutService;
    readonly ST = SymbologyType;
    readonly LoadingState = LoadingState;
    readonly RenameLayerComponent = RenameLayerComponent;
    readonly LineageGraphComponent = LineageGraphComponent;
    readonly LayerExportComponent = LayerExportComponent;
    readonly LayerShareComponent = LayerShareComponent;
    readonly SourceOperatorListComponent = SourceOperatorListComponent;
    readonly SymbologyEditorComponent = SymbologyEditorComponent;

    // inventory of used subscriptions
    private subscriptions: Array<Subscription> = [];

    /**
     * The component constructor. It injects angular and wave services.
     */
    constructor(
        public dialog: MatDialog,
        public layoutService: LayoutService,
        public projectService: ProjectService,
        public layerService: LayerService,
        public mapService: MapService,
        public config: Config,
        public changeDetectorRef: ChangeDetectorRef,
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

    ngOnDestroy() {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    /**
     * the drop method is used by the dran and drop feature of the list
     */
    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.layerList, event.previousIndex, event.currentIndex);
        this.projectService.setLayers([...this.layerList]); // send a copy to keep the list private
    }

    /**
     * select a layer
     */
    toggleLayer(layer: Layer<AbstractSymbology>) {
        this.projectService.toggleSymbology(layer);
    }

    /**
     * method to get the symbology stream of a layer. This is used by the icons and legend components.
     */
    getLayerSymbologyStream<T extends AbstractSymbology>(layer: Layer<T>): Observable<T> {
        return this.projectService.getLayerChangesStream(layer).pipe(
            startWith(layer),
            filter((lc) => !!lc.symbology),
            map(() => layer.symbology),
        );
    }

    /**
     * helper method to cast AbstractSymbology to VectorSymbology
     */
    vectorLayerCast(layer: Layer<AbstractSymbology>): Layer<VectorSymbology> {
        return layer as Layer<VectorSymbology>;
    }

    showChannelParameterSlider(layer: Layer<AbstractSymbology>): boolean {
        return (
            layer.operator.operatorType.toString() === 'GDAL Source' &&
            !!layer.operator.operatorTypeParameterOptions &&
            layer.operator.operatorTypeParameterOptions.getParameterOption('channelConfig').hasTicks()
        );
    }
}
