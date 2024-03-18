import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {MapService} from '../map.service';
import {combineLatestWith, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SpatialReferenceService} from '../../spatial-references/spatial-reference.service';

/**
 * The `geoengine-map-info` displays information about the visible map(s).
 */
@Component({
    selector: 'geoengine-map-info',
    templateUrl: 'map-info.component.html',
    styleUrls: ['map-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapInfoComponent {
    @Input()
    public bottom!: number;

    constructor(
        private mapService: MapService,
        private spatialReferenceService: SpatialReferenceService,
        private projectService: ProjectService,
    ) {}

    info(): Observable<string> {
        return this.projectService.getSpatialReferenceStream().pipe(
            map((srs) => this.spatialReferenceService.getOlProjection(srs).getUnits()),
            combineLatestWith(this.mapService.getViewportSizeStream()),
            map(
                ([unit, viewport]) =>
                    `Resolution: ${viewport.resolution} ${unit}/px
                     x: (${viewport.extent[0]}, ${viewport.extent[2]})
                     y: (${viewport.extent[1]}, ${viewport.extent[3]})`,
            ),
        );
    }
}
