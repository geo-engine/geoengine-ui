import {distinctUntilChanged} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';
import {Extent as OlExtent} from 'ol'
import {containsExtent as olExtentContainsExtent, getIntersection as olExtentGetIntersection} from 'ol/extent';
import {GeometryType as OlGeometryType} from 'ol/geom';
import {Vector as OlSourceVector} from 'ol/source';

import {MapContainerComponent} from './map-container/map-container.component';

export interface ViewportSize {
    extent: Extent;
    resolution: number;
    maxExtent?: [number, number, number, number];
}

type Extent = [number, number, number, number] | OlExtent;

@Injectable()
export class MapService {
    private viewportSize$ = new BehaviorSubject<ViewportSize>({
        extent: [0, 0, 0, 0],
        resolution: 1,
    });

    private mapComponent: MapContainerComponent;

    constructor() {
    }

    public registerMapComponent(mapComponent: MapContainerComponent) {
        this.mapComponent = mapComponent;
    }

    public startDrawInteraction(drawType: OlGeometryType) {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        this.mapComponent.startDrawInteraction(drawType);
    }

    // TODO: decide to use or loose it
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

        if (resolutionChanged(oldViewportSize, newViewportSize) || !extentContains(oldViewportSize, newViewportSize)) {
            // TODO: buffer extent to query more data
            // ol.extent.buffer(newViewportSize.extent, Math.max(w, h) * 0.5);
            let newExtent = newViewportSize.extent;

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
}

function extentContains(vps1: ViewportSize, vps2: ViewportSize): boolean {
    const e1 = (vps1.maxExtent) ? olExtentGetIntersection(vps1.extent, vps1.maxExtent) : vps1.extent;
    const e2 = (vps2.maxExtent) ? olExtentGetIntersection(vps2.extent, vps2.maxExtent) : vps2.extent;
    return olExtentContainsExtent(e1, e2);
}

function resolutionChanged(vps1: ViewportSize, vps2: ViewportSize): boolean {
    return vps1.resolution !== vps2.resolution;
}
