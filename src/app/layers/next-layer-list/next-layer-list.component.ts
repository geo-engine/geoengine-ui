import {Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy} from '@angular/core';
import {MdDialog, MdIconRegistry} from '@angular/material';
import {LayoutService} from '../../layout.service';
import {Observable, Subscription} from 'rxjs/Rx';
import {SymbologyType, Symbology} from '../../../symbology/symbology.model';
import {SymbologyDialogComponent} from '../../../symbology/symbology-dialog.component';
import {RenameLayerComponent} from '../dialogs/rename-layer.component';
import {LoadingState} from '../../project/loading-state.model';
import {DragulaService} from 'ng2-dragula';
import {LayerService} from '../../../layers/layer.service';
import {MapService} from '../../../map/map.service';
import {Layer} from '../../../layers/layer.model';
import {DomSanitizer} from '@angular/platform-browser';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {LineageGraphComponent} from '../../provenance/lineage-graph/lineage-graph.component';
import {LayerExportComponent} from '../dialogs/layer-export/layer-export.component';

@Component({
    selector: 'wave-next-layer-list',
    templateUrl: './next-layer-list.component.html',
    styleUrls: ['./next-layer-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextLayerListComponent implements OnInit, OnDestroy {

    LayoutService = LayoutService;
    layerListVisibility$: Observable<boolean>;
    @Input() height: number;

    // make visible in template
    // tslint:disable:variable-name
    ST = SymbologyType;
    LoadingState = LoadingState;
    RenameLayerComponent = RenameLayerComponent;
    SymbologyDialogComponent = SymbologyDialogComponent;
    LineageGraphComponent = LineageGraphComponent;
    LayerExportComponent = LayerExportComponent;
    SourceOperatorListComponent = SourceOperatorListComponent;
    // tslint:enable

    private subscriptions: Array<Subscription> = [];

    constructor(
     public dialog: MdDialog,
     private layoutService: LayoutService,
     private dragulaService: DragulaService,
     private layerService: LayerService,
     private mapService: MapService,
     private iconRegistry: MdIconRegistry,
     private sanitizer: DomSanitizer
    ) {
        iconRegistry.addSvgIconInNamespace('symbology','polygon',
            sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/polygon_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology','line',
            sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/line_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology','point',
            sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/point_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology','grid4',
            sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/grid4_24.svg'));

     this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();

      dragulaService.setOptions('layer-bag', {
          removeOnSpill: false,
          revertOnSpill: true,
      });

      this.handleDragAndDrop();
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    handleDragAndDrop() {
        let dragIndex: number;
        let dropIndex: number;

        this.subscriptions.push(
            this.dragulaService.drag.subscribe((value: [string, HTMLElement, HTMLElement]) => {
                const [_, listItem, list] = value;
                dragIndex = NextLayerListComponent.domIndexOf(listItem, list);
                // console.log('drag', dragIndex);
            })
        );
        this.subscriptions.push(
            this.dragulaService.drop.subscribe((value: [string, HTMLElement, HTMLElement]) => {
                const [_, listItem, list] = value;
                dropIndex = NextLayerListComponent.domIndexOf(listItem, list);
                // console.log('drop', dropIndex);

                const layers = this.layerService.getLayers();
                layers.splice(dropIndex, 0, layers.splice(dragIndex, 1)[0]);
                this.layerService.setLayers(layers);
            })
        );
    }

    toggleLayer(layer: Layer<Symbology>) {
        this.layerService.toggleLayer(layer);
    }

    private static domIndexOf(child: HTMLElement, parent: HTMLElement) {
        return Array.prototype.indexOf.call(parent.children, child);
    }
}
