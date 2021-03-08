import {Injectable} from '@angular/core';
import {Layer, ProjectService, RasterLayer, VectorLayer} from 'wave-core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DataSelectionService {
    readonly layers: Observable<Array<Layer>>;

    readonly rasterLayer = new BehaviorSubject<RasterLayer>(undefined);
    readonly polygonLayer = new BehaviorSubject<VectorLayer>(undefined);

    constructor(private readonly projectService: ProjectService) {
        this.layers = combineLatest([this.rasterLayer, this.polygonLayer]).pipe(map((layers) => layers.filter((layer) => !!layer)));
    }

    setRasterLayer(layer: RasterLayer): Observable<void> {
        return this.rasterLayer.pipe(
            first(),
            mergeMap((currentLayer) => {
                if (currentLayer) {
                    return this.projectService.removeLayer(currentLayer);
                } else {
                    return of(undefined);
                }
            }),
            tap(() => this.rasterLayer.next(undefined)),
            mergeMap(() => this.projectService.addLayer(layer)),
            tap(() => this.rasterLayer.next(layer)),
        );
    }

    setPolygonLayer(layer: VectorLayer): Observable<void> {
        return this.polygonLayer.pipe(
            first(),
            mergeMap((currentLayer) => {
                if (currentLayer) {
                    return this.projectService.removeLayer(currentLayer);
                } else {
                    return of(undefined);
                }
            }),
            tap(() => this.polygonLayer.next(undefined)),
            mergeMap(() => this.projectService.addLayer(layer)),
            tap(() => this.polygonLayer.next(layer)),
        );
    }
}
