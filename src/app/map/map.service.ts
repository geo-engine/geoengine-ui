
import {distinctUntilChanged} from 'rxjs/operators';
import {Observable, BehaviorSubject, Subject} from 'rxjs';

import {Injectable} from '@angular/core';
import ol from 'ol';
import olExtent from 'ol/extent'
import {Symbology} from '../layers/symbology/symbology.model';
import {Layer} from '../layers/layer.model';
import {MapComponent} from './map.component';

export interface ViewportSize {
    extent: Extent;
    resolution: number;
    maxExtent?: [number, number, number, number];
}

type Extent = [number, number, number, number]  | ol.Extent;

@Injectable()
export class MapService {
    private viewportSize$ = new BehaviorSubject<ViewportSize>({
        extent: [0, 0, 0, 0],
        resolution: 1,
    });

    private mapComponent: MapComponent;
    private zoomToExtent$ = new Subject<Extent>();
    private zoomToLayer$ = new Subject<Layer<Symbology>>();

    constructor() {
        // this.viewportSize$.subscribe(
        //    v => console.log('viewport', v.extent.join(','), v.resolution)
        // );
    }

    getZoomToExtentStream(): Observable<Extent> {
        return this.zoomToExtent$;
    }

    getZoomToLayerStream(): Observable<Layer<Symbology>> {
        return this.zoomToLayer$;
    }

    public zoomToLayer(l: Layer<Symbology>) {
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

    public startDrawInteraction(drawType: ol.geom.GeometryType) {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        this.mapComponent.startDrawInteraction(drawType);
    }

    public isDrawInteractionAttached(): boolean {
        return this.mapComponent.isDrawInteractionAttached();
    }

    public endDrawInteraction(): ol.source.Vector {
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

            const w = olExtent.getWidth(newViewportSize.extent);
            const h = olExtent.getHeight(newViewportSize.extent);
            let newExtent = newViewportSize.extent; // ol.extent.buffer(newViewportSize.extent, Math.max(w, h) * 0.5);

            if (newViewportSize.maxExtent) {
                newExtent = olExtent.getIntersection(newExtent, newViewportSize.maxExtent);
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
        const e1 = (vps1.maxExtent) ? olExtent.getIntersection(vps1.extent, vps1.maxExtent) : vps1.extent;
        const e2 = (vps2.maxExtent) ? olExtent.getIntersection(vps2.extent, vps2.maxExtent) : vps2.extent;
        const contains = olExtent.containsExtent(e1, e2);
        return contains;
    }
}
