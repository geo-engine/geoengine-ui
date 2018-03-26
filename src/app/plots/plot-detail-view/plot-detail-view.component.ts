import {AfterViewInit, ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {ProjectService} from '../../project/project.service';
import {Plot} from '../plot.model';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs/Rx';
import {LayoutService} from '../../layout.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {MapService} from '../../map/map.service';

@Component({
    selector: 'wave-plot-detail-view',
    templateUrl: './plot-detail-view.component.html',
    styleUrls: ['./plot-detail-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotDetailViewComponent implements OnInit, AfterViewInit {

    maxWidth$ = new ReplaySubject<number>(1);
    maxHeight$ = new ReplaySubject<number>(1);

    // initially blank pixel
    imagePlotData$ = new BehaviorSubject('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
    imagePlotLoading$ = new BehaviorSubject(true);

    constructor(public projectService: ProjectService,
                private mapService: MapService,
                private mappingQueryService: MappingQueryService,
                @Inject(MAT_DIALOG_DATA) public plot: Plot) {
    }

    ngOnInit() {
        Observable
            .combineLatest(
                this.projectService.getPlotDataStream(this.plot),
                this.projectService.getTimeStream(),
                this.projectService.getProjectionStream(),
                this.mapService.getViewportSizeStream(),
                this.maxWidth$, this.maxHeight$
            )
            .first()
            .subscribe(([plotData, time, projection, viewport, width, height]) => {
                // set data uri for png type and load full screen image
                if (plotData.type === 'png') {
                    this.imagePlotData$.next(`data:image/png;base64,${plotData.data}`);

                    this.mappingQueryService
                        .getPlotData({
                            operator: this.plot.operator,
                            time: time,
                            extent: viewport.extent,
                            projection: projection,
                            plotWidth: width - LayoutService.remInPx(),
                            plotHeight: height,
                        })
                        .first()
                        .subscribe(newPlotData => {
                            this.imagePlotData$.next(`data:image/png;base64,${newPlotData.data}`);

                            this.imagePlotLoading$.next(false);
                        });
                }
            });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.maxWidth$.next(window.innerWidth - 2 * LayoutService.remInPx());
            this.maxHeight$.next(window.innerHeight - 2 * LayoutService.remInPx() - LayoutService.getToolbarHeightPx());
        });
    }

}
