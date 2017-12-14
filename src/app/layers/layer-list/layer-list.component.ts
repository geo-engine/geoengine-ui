import {Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy} from '@angular/core';
import {MdDialog, MdIconRegistry} from '@angular/material';
import {LayoutService} from '../../layout.service';
import {Observable, Subscription} from 'rxjs/Rx';
import {SymbologyType, Symbology} from '../symbology/symbology.model';

import {RenameLayerComponent} from '../dialogs/rename-layer.component';
import {LoadingState} from '../../project/loading-state.model';
import {DragulaService} from 'ng2-dragula';
import {LayerService} from '../layer.service';
import {MapService} from '../../map/map.service';
import {Layer} from '../layer.model';
import {DomSanitizer} from '@angular/platform-browser';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {LineageGraphComponent} from '../../provenance/lineage-graph/lineage-graph.component';
import {LayerExportComponent} from '../dialogs/layer-export/layer-export.component';
import {ProjectService} from '../../project/project.service';
import {LayerShareComponent} from '../dialogs/layer-share/layer-share.component';
import {Config} from '../../config.service';

@Component({
    selector: 'wave-layer-list',
    templateUrl: './layer-list.component.html',
    styleUrls: ['./layer-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListComponent implements OnInit, OnDestroy {

    LayoutService = LayoutService;
    layerListVisibility$: Observable<boolean>;
    @Input() height: number;

    // make visible in template
    // tslint:disable:variable-name
    ST = SymbologyType;
    LoadingState = LoadingState;
    RenameLayerComponent = RenameLayerComponent;

    LineageGraphComponent = LineageGraphComponent;
    LayerExportComponent = LayerExportComponent;
    LayerShareComponent = LayerShareComponent;
    SourceOperatorListComponent = SourceOperatorListComponent;
    // tslint:enable

    dragOptions = {
        removeOnSpill: false,
        revertOnSpill: true,
        moves: (el, source, handle, sibling): boolean => {
            let s = handle;
            while ((s = s.parentElement) && !!s && !s.classList.contains('no-drag')) {
            }
            return !s;
        }
    };

    private subscriptions: Array<Subscription> = [];

    private static domIndexOf(child: HTMLElement, parent: HTMLElement) {
        return Array.prototype.indexOf.call(parent.children, child);
    }

    constructor(public dialog: MdDialog,
                private layoutService: LayoutService,
                private dragulaService: DragulaService,
                private projectService: ProjectService,
                private layerService: LayerService,
                private mapService: MapService,
                private iconRegistry: MdIconRegistry,
                private sanitizer: DomSanitizer,
                public config: Config) {
        iconRegistry.addSvgIconInNamespace('symbology', 'polygon',
            sanitizer.bypassSecurityTrustResourceUrl('assets/icons/polygon_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology', 'line',
            sanitizer.bypassSecurityTrustResourceUrl('assets/icons/line_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology', 'point',
            sanitizer.bypassSecurityTrustResourceUrl('assets/icons/point_24.svg'));
        iconRegistry.addSvgIconInNamespace('symbology', 'grid4',
            sanitizer.bypassSecurityTrustResourceUrl('assets/icons/grid4_24.svg'));

        this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();

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
                dragIndex = LayerListComponent.domIndexOf(listItem, list);
                // console.log('drag', dragIndex);
            })
        );
        this.subscriptions.push(
            this.dragulaService.drop.subscribe((value: [string, HTMLElement, HTMLElement]) => {
                const [_, listItem, list] = value;
                dropIndex = LayerListComponent.domIndexOf(listItem, list);
                // console.log('drop', dropIndex);

                this.projectService.getLayerStream().first().subscribe(layers => {
                    let shiftedLayers: Array<Layer<Symbology>> = [...layers];
                    shiftedLayers.splice(dropIndex, 0, shiftedLayers.splice(dragIndex, 1)[0]);
                    this.projectService.setLayers(shiftedLayers)
                });
            })
        );
    }

    toggleLayer(layer: Layer<Symbology>) {
        this.projectService.toggleSymbology(layer);
    }

    update_symbology(layer: Layer<Symbology>, symbology: Symbology) {
        this.projectService.changeLayer(layer, {symbology: symbology});
    }

}
