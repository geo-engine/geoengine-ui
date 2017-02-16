import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject, Subject} from 'rxjs/Rx';
import * as ol from 'openlayers';
import {MapComponent} from "./map.component";
import {Symbology} from "../symbology/symbology.model";
import {Layer} from "../layers/layer.model";

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

    private zoomToExtent$ = new Subject<Extent>();
    private zoomToLayer$ = new Subject<Layer<Symbology>>();

    constructor() {
        //this.viewportSize$.subscribe(
        //   v => console.log('viewport', v.extent.join(','), v.resolution)
        //);
    }

    getZoomToExtentStream(): Observable<Extent>{
        return this.zoomToExtent$;
    }

    getZoomToLayerStream(): Observable<Layer<Symbology>>{
        return this.zoomToLayer$;
    }

    public zoomToLayer(l: Layer<Symbology>) {
        this.zoomToLayer$.next(l);
    }

    public zoomToExtent(extent: Extent) {
        this.zoomToExtent$.next(extent);
    }

    setViewportSize(newViewportSize: ViewportSize) {
        if (newViewportSize.extent.length !== 4 || newViewportSize.resolution <= 0) {
            throw 'Corrupt Viewport Size';
        }

        const oldViewportSize = this.viewportSize$.value;

        if (
            this.resolutionChanged(oldViewportSize, newViewportSize)
            || !this.extentContains(oldViewportSize, newViewportSize)
        ) {

            const w = ol.extent.getWidth(newViewportSize.extent);
            const h = ol.extent.getHeight(newViewportSize.extent);
            let newExtent = ol.extent.buffer(newViewportSize.extent, Math.max(w, h) * 0.5);

            if (newViewportSize.maxExtent ) {
                newExtent = ol.extent.getIntersection(newExtent, newViewportSize.maxExtent);
            }

            newViewportSize.extent = newExtent;

            this.viewportSize$.next(newViewportSize);
        }
    }

    getViewportSize(): ViewportSize {
        return this.viewportSize$.value;
    }

    getViewportSizeStream(): Observable<ViewportSize> {
        return this.viewportSize$;
    }

    private resolutionChanged(vps1: ViewportSize, vps2: ViewportSize): boolean {
        return vps1.resolution !== vps2.resolution;
    }

    private extentContains(vps1: ViewportSize, vps2: ViewportSize): boolean  {
        const e1 = (vps1.maxExtent) ? ol.extent.getIntersection(vps1.extent, vps1.maxExtent) : vps1.extent;
        const e2 = (vps2.maxExtent) ? ol.extent.getIntersection(vps2.extent, vps2.maxExtent) : vps2.extent;
        const contains = ol.extent.containsExtent(e1, e2);
        return contains;
    }
}
