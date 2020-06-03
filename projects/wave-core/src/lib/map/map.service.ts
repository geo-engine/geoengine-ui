import {distinctUntilChanged} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';
import {Extent as OlExtent} from 'ol';
import {containsExtent as olExtentContainsExtent, getIntersection as olExtentGetIntersection} from 'ol/extent';
import {GeometryType as OlGeometryType} from 'ol/geom';
import {Vector as OlSourceVector} from 'ol/source';

import {MapContainerComponent} from './map-container/map-container.component';

/**
 * The viewport combines…
 *  * the extent in map units,
 *  * the resolution in pixels per map unit and
 *  * the (optional) maximum allowed extent
 */
export interface ViewportSize {
    extent: Extent;
    resolution: number;
    maxExtent?: [number, number, number, number];
}

/**
 * The extent is defined as [min x, min y, max x, max y] map units
 */
export type Extent = [number, number, number, number] | OlExtent;

/**
 * The map service provides means to work with a registered map component.
 */
@Injectable()
export class MapService {
    private viewportSize$ = new BehaviorSubject<ViewportSize>({
        extent: [0, 0, 0, 0],
        resolution: 1,
    });

    private mapComponent: MapContainerComponent;
    private isGridStream = new BehaviorSubject(false);

    constructor() {
    }

    /**
     * Returns events that indicate if the map is in grid or default mode
     */
    public get isGrid$(): Observable<boolean> {
        return this.isGridStream;
    }

    /**
     * Define if the map is in grid mode (one layer per tile) or if it displays
     * all layers on one tile.
     */
    public setGrid(isGrid: boolean) {
        this.isGridStream.next(isGrid);
    }

    /**
     * This service only works if a map component is registered here upfront.
     */
    public registerMapComponent(mapComponent: MapContainerComponent) {
        this.mapComponent = mapComponent;
    }

    public startDrawInteraction(drawType: OlGeometryType) {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        this.mapComponent.startDrawInteraction(drawType);
    }

    /**
     * Returns whether the map currently has a draw interaction
     */
    // TODO: decide to use or loose it
    public isDrawInteractionAttached(): boolean {
        return this.mapComponent.isDrawInteractionAttached();
    }

    /**
     * Stops a draw interaction on the map and returns the output vector as result
     */
    public endDrawInteraction(): OlSourceVector {
        if (!this.mapComponent) {
            throw new Error('no MapComponent registered');
        }
        return this.mapComponent.endDrawInteraction();
    }

    /**
     * Changes the viewport of the map
     */
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

    /**
     * Returns the current viewport of the map
     */
    getViewportSize(): ViewportSize {
        return this.viewportSize$.value;
    }

    /**
     * Returns events that indicate the viewport upon changes of the map
     * Initially emits the current viewport
     */
    getViewportSizeStream(): Observable<ViewportSize> {
        return this.viewportSize$.pipe(distinctUntilChanged());
    }

    /**
     * Trigger a zoom event at the map to an extent
     */
    zoomTo(boundingBox: Extent) {
        this.mapComponent.zoomTo(boundingBox);
    }
}

/**
 * Is the extent of `vps1` contained in the extent of `vps2`?
 */
function extentContains(vps1: ViewportSize, vps2: ViewportSize): boolean {
    const e1 = (vps1.maxExtent) ? olExtentGetIntersection(vps1.extent, vps1.maxExtent) : vps1.extent;
    const e2 = (vps2.maxExtent) ? olExtentGetIntersection(vps2.extent, vps2.maxExtent) : vps2.extent;
    return olExtentContainsExtent(e1, e2);
}

/**
 * Checks for equality of the resolution component of two `ViewportSize`s
 */
function resolutionChanged(vps1: ViewportSize, vps2: ViewportSize): boolean {
    return vps1.resolution !== vps2.resolution;
}
