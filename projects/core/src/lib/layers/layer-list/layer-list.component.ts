import {Observable, Subscription} from 'rxjs';
import {Component, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatDialog} from '@angular/material/dialog';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {MapService} from '../../map/map.service';
import {Layer} from '../layer.model';
import {ProjectService} from '../../project/project.service';
import {Config} from '../../config.service';
import {AddDataComponent} from '../../datasets/add-data/add-data.component';
import {TabsService} from '../../tabs/tabs.service';
import {SimpleChanges} from '@angular/core';
import {NotificationService} from '../../notification.service';

/**
 * The layer list component displays active layers, legends and other controlls.
 */
@Component({
    selector: 'geoengine-layer-list',
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

    // inventory of used subscriptions
    private subscriptions: Array<Subscription> = [];

    /**
     * The component constructor. It injects angular and geoengine services.
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
     * helper method to cast AbstractSymbology to VectorSymbology
     */
    vectorLayerCast(layer: Layer): Layer {
        return layer as Layer;
    }
}
