import {Injectable} from '@angular/core';
import {Layer, ProjectService, RasterLayer, Time, VectorLayer, LoadingState} from 'wave-core';
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
    readonly intensityLayer = new BehaviorSubject<RasterLayer | undefined>(undefined);
    readonly speciesLayer = new BehaviorSubject<VectorLayer | undefined>(undefined);

    readonly speciesLoadingState$: Observable<'query' | 'determinate'>;

    readonly timeSteps = new BehaviorSubject<Array<Time>>([new Time(moment.utc())]);
    readonly timeFormat = new BehaviorSubject<string>('YYYY');

    readonly dataRange = new BehaviorSubject<DataRange>({min: 0, max: 1});

    constructor(private readonly projectService: ProjectService) {
        this.layers = combineLatest([this.rasterLayer, this.intensityLayer, this.speciesLayer]).pipe(
            map(([rasterLayer, intensityLayer, speciesLayer]) => {
                const layers = [];
                if (rasterLayer) {
                    layers.push(rasterLayer);
                }
                if (intensityLayer) {
                    layers.push(intensityLayer);
                }
                if (speciesLayer) {
                    layers.push(speciesLayer);
                }
                return layers;
            }),
        );

        this.speciesLoadingState$ = this.speciesLayer.pipe(
            mergeMap((layer) => {
                if (layer) {
                    return this.projectService.getLayerStatusStream(layer);
                } else {
                    return of(LoadingState.OK);
                }
            }),
            map((status) => (status === LoadingState.LOADING ? 'query' : 'determinate')),
        );
    }

    setTimeSteps(timeSteps: Array<Time>, preselectComparator?: (currentTime: Time, timeStep: Time) => boolean): void {
        if (!timeSteps.length) {
            throw Error('`timeSteps` must not be empty');
        }

        this.projectService
            .getTimeOnce()
            .pipe(
                map((currentTime) => {
                    if (!preselectComparator) {
                        return timeSteps[0];
                    }

                    for (const timeStep of timeSteps) {
                        if (preselectComparator(currentTime, timeStep)) {
                            return timeStep;
                        }
                    }

                    return timeSteps[0];
                }),
                mergeMap((newTime) => this.projectService.setTime(newTime)),
            )
            .subscribe(() => {
                this.timeSteps.next(timeSteps);
            });
    }

    setRasterLayer(layer: RasterLayer, dataRange: DataRange): Observable<void> {
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
                this.dataRange.next(dataRange);
            }),
        );
    }

    setIntensityLayer(layer?: RasterLayer): Observable<void> {
        const removeOperation = this.rasterLayer.pipe(
            first(),
            mergeMap((currentLayer) => {
                if (currentLayer) {
                    return this.projectService.removeLayer(currentLayer);
                } else {
                    return of(undefined);
                }
            }),
            tap(() => this.intensityLayer.next(undefined)),
        );

        if (!layer) {
            return removeOperation;
        }

        return removeOperation.pipe(
            mergeMap(() => this.projectService.addLayer(layer)),
            tap(() => {
                this.intensityLayer.next(layer);
            }),
        );
    }

    setSpeciesLayer(layer: VectorLayer): Observable<void> {
        return this.speciesLayer.pipe(
            first(),
            mergeMap((currentLayer) => {
                if (currentLayer) {
                    return this.projectService.removeLayer(currentLayer);
                } else {
                    return of(undefined);
                }
            }),
            tap(() => this.speciesLayer.next(undefined)),
            mergeMap(() => this.projectService.addLayer(layer)),
            tap(() => this.speciesLayer.next(layer)),
        );
    }
}
