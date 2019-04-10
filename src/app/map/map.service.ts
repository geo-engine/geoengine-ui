
import {distinctUntilChanged} from 'rxjs/operators';
import {Observable, BehaviorSubject, Subject} from 'rxjs';

import {Injectable} from '@angular/core';
import {Extent as OlExtent} from 'ol'
import {getHeight as olExtentGetHeight, getWidth as olExtentGetWidth, getIntersection as olExtentGetIntersection, containsExtent as olExtentContainsExtent} from 'ol/extent';
import {GeometryType as OlGeometryType} from 'ol/geom';
import {Vector as OlSourceVector} from 'ol/source';

import {AbstractSymbology} from '../layers/symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {MapComponent} from './map.component';

export interface ViewportSize {
    extent: Extent;
    resolution: number;
    maxExtent?: [number, number, number, number];
}

type Extent = [number, number, number, number]  | OlExtent;

@Injectable()
export class MapService {
    private viewportSize$ = new BehaviorSubject<ViewportSize>({
        extent: [0, 0, 0, 0],
        resolution: 1,
    });

    private mapComponent: MapComponent;
    private zoomToExtent$ = new Subject<Extent>();
    private zoomToLayer$ = new Subject<Layer<AbstractSymbology>>();

    constructor() {
        // this.viewportSize$.subscribe(
        //    v => console.log('viewport', v.extent.join(','), v.resolution)
        // );
    }

    getZoomToExtentStream(): Observable<Extent> {
        return this.zoomToExtent$;
    }

    getZoomToLayerStream(): Observable<Layer<AbstractSymbology>> {
        return this.zoomToLayer$;
    }

    public zoomToLayer(l: Layer<AbstractSymbology>) {
        this.zoomToLayer$.next(l);
    }

    public zoomToLayers(l: Iterable<Layer<any>>) {

    }

    public zoomToExtent(extent: Extent) {
        this.zoomToExtent$.next(extent);
    }

    public registerMapComponent(mapComponent: MapComponent) {
        this.mapComponent = mapComponent;
    }

    public startDrawInteraction(drawType: OlGeometryType) {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        this.mapComponent.startDrawInteraction(drawType);
    }

    public isDrawInteractionAttached(): boolean {
        return this.mapComponent.isDrawInteractionAttached();
    }

    public endDrawInteraction(): OlSourceVector {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        return this.mapComponent.endDrawInteraction();
    }

    setViewportSize(newViewportSize: ViewportSize) {
        if (newViewportSize.extent.length !== 4 || newViewportSize.resolution <= 0) {
            throw Error('Corrupt Viewport Size');
        }

        const oldViewportSize = this.viewportSize$.value;

        if (
            this.resolutionChanged(oldViewportSize, newViewportSize)
            || !this.extentContains(oldViewportSize, newViewportSize)
        ) {

            const w = olExtentGetWidth(newViewportSize.extent);
            const h = olExtentGetHeight(newViewportSize.extent);
            let newExtent = newViewportSize.extent; // ol.extent.buffer(newViewportSize.extent, Math.max(w, h) * 0.5);

            if (newViewportSize.maxExtent) {
                newExtent = olExtentGetIntersection(newExtent, newViewportSize.maxExtent);
            }

            newViewportSize.extent = newExtent;

            this.viewportSize$.next(newViewportSize);
        }
    }

    getViewportSize(): ViewportSize {
        return this.viewportSize$.value;
    }

    getViewportSizeStream(): Observable<ViewportSize> {
        return this.viewportSize$.pipe(distinctUntilChanged());
    }

    private resolutionChanged(vps1: ViewportSize, vps2: ViewportSize): boolean {
        return vps1.resolution !== vps2.resolution;
    }

    private extentContains(vps1: ViewportSize, vps2: ViewportSize): boolean {
        const e1 = (vps1.maxExtent) ? olExtentGetIntersection(vps1.extent, vps1.maxExtent) : vps1.extent;
        const e2 = (vps2.maxExtent) ? olExtentGetIntersection(vps2.extent, vps2.maxExtent) : vps2.extent;
        const contains = olExtentContainsExtent(e1, e2);
        return contains;
    }
}
