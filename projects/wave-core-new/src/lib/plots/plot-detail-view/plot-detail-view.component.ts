import {AfterViewInit, ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {BehaviorSubject, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ProjectService} from '../../project/project.service';
import {Plot} from '../plot.model';

@Component({
    selector: 'wave-plot-detail-view',
    templateUrl: './plot-detail-view.component.html',
    styleUrls: ['./plot-detail-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotDetailViewComponent implements OnInit, AfterViewInit {

    // TODO: implement strategy for PNGs

    // maxWidth$ = new ReplaySubject<number>(1);
    // maxHeight$ = new ReplaySubject<number>(1);

    // initially blank pixel
    // imagePlotData$ = new BehaviorSubject('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');

    plotLoading$ = new BehaviorSubject(true);
    plotData$ = new Observable<any>();

    constructor(public projectService: ProjectService,
                @Inject(MAT_DIALOG_DATA) public plot: Plot) {
    }

    ngOnInit() {
        this.plotData$ = this.projectService.getPlotDataStream(this.plot).pipe(
            tap(() => this.plotLoading$.next(false)),
        );

        // combineLatest([
        //     this.projectService.getPlotDataStream(this.plot),
        //     this.projectService.getTimeStream(),
        //     this.mapService.getViewportSizeStream(),
        //     this.maxWidth$,
        //     this.maxHeight$,
        // ]).pipe(
        //     first())
        //     .subscribe(([plotData, time, projection, viewport, width, height]) => {
        //         // set data uri for png type and load full screen image
        //         // if (plotData.type === 'png') {
        //             // this.imagePlotData$.next(`data:image/png;base64,${plotData.data}`);
        //
        //             this.backend
        //                 .getPlot(plot.workflow, {
        //                     operator: this.plot.operator,
        //                     time: time,
        //                     extent: viewport.extent,
        //                     projection: projection,
        //                     plotWidth: width - LayoutService.remInPx,
        //                     plotHeight: height,
        //                 }).pipe(
        //                 first())
        //                 .subscribe(newPlotData => {
        //                     this.imagePlotData$.next(`data:image/png;base64,${newPlotData.data}`);
        //
        //                     this.imagePlotLoading$.next(false);
        //                 });
        //         }
        //     });
    }

    ngAfterViewInit() {
        // setTimeout(() => {
        //     this.maxWidth$.next(window.innerWidth - 2 * LayoutService.remInPx);
        //     this.maxHeight$.next(window.innerHeight - 2 * LayoutService.remInPx - LayoutService.getToolbarHeightPx());
        // });
    }

}
