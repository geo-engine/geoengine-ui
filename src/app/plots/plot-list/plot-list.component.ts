import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {BehaviorSubject, Subscription} from 'rxjs/Rx';
import {LoadingState} from '../../project/loading-state.model';
import {MdDialog} from '@angular/material';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {subscriptionLogsToBeFn} from 'rxjs/testing/TestScheduler';

@Component({
    selector: 'wave-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotListComponent implements OnInit, AfterViewInit, OnDestroy {

    LoadingState = LoadingState;
    PlotDetailViewComponent = PlotDetailViewComponent;

    cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);

    private subsriptions: Array<Subscription> = [];

    constructor(public projectService: ProjectService,
                public dialog: MdDialog,
                private elementRef: ElementRef) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.subsriptions.push(
            this.projectService.getPlotStream()
                .filter(plots => plots.length > 0)
                .first()
                .subscribe(() => {
                    setTimeout(() => {
                        const cardContent = this.elementRef.nativeElement.querySelector('md-card');
                        const width = parseInt(getComputedStyle(cardContent).width, 10);
                        this.cardWidth$.next(width);
                    });
                })
        );
    }

    ngOnDestroy() {
        this.subsriptions.forEach(subscription => subscription.unsubscribe());
    }

}
