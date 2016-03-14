import {Component, ViewChild, ElementRef, AfterViewInit, NgZone,
        ChangeDetectionStrategy} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

import {InfoAreaComponent} from './info-area.component';
import {TabComponent} from './tab.component';
import {InfoBarComponent} from './info-bar.component';
import {LayerComponent} from './layer.component';
import {AngularGrid} from './angular-grid';
import {MapComponent} from './openlayers/map.component';
import {MapLayerComponent} from './openlayers/layer.component';

import {Layer} from './layer.model';
import {Operator, ResultType} from './operator.model';

import {LayerService} from './services/layer.service';

@Component({
    selector: 'wave-app',
    template: `
    <div class="topContainer md-whiteframe-5dp" layout="row">
        <div class="infoArea"><info-area-component></info-area-component></div>
        <div flex="grow">
            <tab-component
                [layerSelected]="hasSelectedLayer | async"
                (zoomIn)="mapComponent.zoomIn()" (zoomOut)="mapComponent.zoomOut()"
                (zoomLayer)="mapComponent.zoomToLayer(layersReverse.indexOf(selectedLayer))"
                (zoomMap)="mapComponent.zoomToMap()">
            </tab-component>
        </div>
    </div>
    <div class="middleContainer md-whiteframe-5dp" [style.height]="middleContainerHeight" layout="row">
        <div class="layers">
            <layer-component [layers]="layers">
            </layer-component>
        </div>
        <div flex="grow">
            <ol-map [height]="mapHeight">
                <ol-layer *ngFor="#layer of layersReverse"
                          [type]="layer.resultType"
                          [url]="layer.url"
                          [params]="layer.params"
                          [style]="layer.style"></ol-layer>
            </ol-map>
        </div>
    </div>
    <div class="bottomContainer md-whiteframe-5dp" [style.height.px]="bottomContainerHeight">
        <md-toolbar class="infoBar">
            <info-bar-component (tableOpen)="dataTableVisible=$event"></info-bar-component>
        </md-toolbar>
        <div class="dataTable" *ngIf="dataTableVisible">
            <angular-grid [height]="bottomContainerHeight - 40">
            </angular-grid>
        </div>
    </div>
    `,
    styles: [`
    .topContainer {
        position: absolute;
        top: 0px;
        height: 180px;
        left: 0px;
        right: 0px;
    }
    .infoArea {
        width: 200px;
    }
    .middleContainer {
        position: absolute;
        top: 180px;
        left: 0px;
        right: 0px;
    }
    .middleContainer .layers {
        width: 200px;
    }
    .bottomContainer {
        position: absolute;
        bottom: 0px;
        left: 0px;
        right: 0px;

        overflow: hidden;
    }
    .bottomContainer .infoBar {
        min-height: 40px;
        height: 40px;
    }
    `],
    directives: [MATERIAL_DIRECTIVES, InfoAreaComponent, TabComponent, LayerComponent,
                 MapComponent, MapLayerComponent, InfoBarComponent, AngularGrid],
    //changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [LayerService]
})
export class AppComponent {
    private layerListVisible: boolean = true;
    private _dataTableVisible: boolean = true;
    
    private get dataTableVisible() {
        return this._dataTableVisible;
    }
    
    private set dataTableVisible(value: boolean) {
        this._dataTableVisible = value;
        this.changeSizes();
        this.mapComponent.resize();
    }

    @ViewChild(MapComponent)
    private mapComponent: MapComponent;

    private bottomContainerHeight: number = window.innerHeight / 3;
    private middleContainerHeight: number;
    
    private changeSizes() {
        this.zone.run(() => {
            this.bottomContainerHeight = this.dataTableVisible ? window.innerHeight / 3 : 40;
            this.middleContainerHeight = Math.max(window.innerHeight - this.bottomContainerHeight - 180, 0);
        });
    }
    
    constructor(private zone: NgZone,
                private layerService: LayerService) {
        window.onresize = () => {
            this.changeSizes();
        };
        this.changeSizes();
    }

//    clicked(message: string) {
//        alert(message);
//    }
//
//    layersClicked() {
//        this.layerListVisible = !this.layerListVisible;
//        this.mapComponent.resize();
//    }

    private layers: Array<Layer> = [
        new Layer(new Operator(
            'source',
            ResultType.RASTER, 
            new Map<string, string | number>().set('channel', 0).set('sourcename', 'srtm'),
            'EPSG:4326',
            'SRTM'
        )),
        new Layer(new Operator(
            'gfbiopointsource',
            ResultType.POINTS,
            new Map<string, string | number>()
                .set('datasource', 'GBIF')
                .set('query', '{"globalAttributes":{"speciesName":"Puma concolor"},"localAttributes":{}}'),
            'EPSG:4326',
            'Puma Concolor'
        ))
    ];
    
    private get layersReverse() {
        return this.layers.slice(0).reverse();
    }
    
    //private selectedLayer: Layer;
    private get hasSelectedLayer() {
        return this.layerService.getSelectedLayer().map(value => value !== undefined);
    }
    
//    private getTabularData(): Array<{}> {
//        //console.log('called!', this.hasSelectedLayer, this.selectedLayer);
//        if(this.hasSelectedLayer) {
//            let layerIndex = this.layersReverse.indexOf(this.selectedLayer);
//            return this.mapComponent.getLayerData(layerIndex);
//        } else {
//           return [];
//        }
//    }
    
}
