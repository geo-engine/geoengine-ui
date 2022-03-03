import {Injectable} from '@angular/core';
import {Layer, ProjectService, RasterLayer, Time, VectorLayer} from 'wave-core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import moment from 'moment';

export interface DataRange {
    min: number;
    max: number;
}

@Injectable({
    providedIn: 'root',
})
export class DataSelectionService {
    readonly layers: Observable<Array<Layer>>;

    readonly rasterLayer = new BehaviorSubject<RasterLayer | undefined>(undefined);
    readonly polygonLayer = new BehaviorSubject<VectorLayer | undefined>(undefined);

    readonly timeSteps = new BehaviorSubject<Array<Time>>([new Time(moment.utc())]);
    readonly timeFormat = new BehaviorSubject<string>('YYYY'); // TODO: make configurable

    readonly dataRange = new BehaviorSubject<DataRange>({min: 0, max: 1});

    constructor(private readonly projectService: ProjectService) {
        this.layers = combineLatest([this.rasterLayer, this.polygonLayer]).pipe(
            map(([rasterLayer, polygonLayer]) => {
                const layers = [];
                if (rasterLayer) {
                    layers.push(rasterLayer);
                }
                if (polygonLayer) {
                    layers.push(polygonLayer);
                }
                return layers;
            }),
        );
    }

    setRasterLayer(layer: RasterLayer, timeSteps: Array<Time>, dataRange: DataRange): Observable<void> {
        if (!timeSteps.length) {
            throw Error('`timeSteps` are required when setting a raster');
        }

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
            tap(() => {
                this.rasterLayer.next(layer);
                this.timeSteps.next(timeSteps);
                this.projectService.setTime(timeSteps[0]);
                this.dataRange.next(dataRange);
            }),
        );
    }

    clearPolygonLayer(): Observable<void> {
        return this.polygonLayer.pipe(
            first(),
            mergeMap((currentLayer) => {
                if (currentLayer) {
                    return this.projectService.removeLayer(currentLayer);
                } else {
                    return of(undefined);
                }
            }),
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
