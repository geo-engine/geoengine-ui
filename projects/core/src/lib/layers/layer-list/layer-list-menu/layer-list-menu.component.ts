import {Component, ChangeDetectionStrategy} from '@angular/core';
import {LayoutService} from '../../../layout.service';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Observable} from 'rxjs';
import {CoreConfig} from '../../../config.service';

@Component({
    selector: 'geoengine-layer-list-menu',
    templateUrl: './layer-list-menu.component.html',
    styleUrls: ['./layer-list-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class LayerListMenuComponent {
    /**
     * sends if the layerlist should be visible
     */
    readonly layerListVisibility$: Observable<boolean>;

    /**
     * sends if the map should be a grid (or else a single map)
     */
    readonly mapIsGrid$: Observable<boolean>;

    constructor(
        public layoutService: LayoutService,
        public mapService: MapService,
        public projectService: ProjectService,
        public config: CoreConfig,
    ) {
        this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();

        this.mapIsGrid$ = this.mapService.isGrid$;
    }
}
