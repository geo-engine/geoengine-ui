import {BehaviorSubject, Subscription} from 'rxjs';
import {filter, first} from 'rxjs/operators';

import {MatDialog} from '@angular/material/dialog';
import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {OperatorListComponent} from '../../operators/dialogs/operator-list/operator-list.component';
import {ProjectService} from '../../project/project.service';
import {LayoutService} from '../../layout.service';
import {Plot} from '../plot.model';
import {LoadingState} from '../../project/loading-state.model';


/**
 * This component lists all current plots.
 */
@Component({
    selector: 'wave-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListComponent implements OnInit, AfterViewInit, OnDestroy {

    /**
     * If the list is empty, show the following button.
     */
    @Input() operatorsListConfig = {component: OperatorListComponent};

    readonly cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(public readonly projectService: ProjectService,
                public readonly dialog: MatDialog,
                private readonly layoutService: LayoutService,
                private readonly elementRef: ElementRef) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.subscriptions.push(
            this.projectService.getPlotStream().pipe(
                filter(plots => plots.length > 0),
                first(),
            ).subscribe(() => {
                setTimeout(() => {
                    const cardContent = this.elementRef.nativeElement.querySelector('mat-card');
                    const width = parseInt(getComputedStyle(cardContent).width, 10);
                    this.cardWidth$.next(width);
                });
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * Loads the component in `operatorsListConfig` into the sidenav
     */
    goToOperatorsTab() {
        this.layoutService.setSidenavContentComponent(this.operatorsListConfig);
    }

    /**
     * Show a plot as a fullscreen modal dialog
     */
    showFullscreen(_plot: Plot) {
        // TODO: implement
        // this.dialog.open(
        //     PlotDetailViewComponent,
        //     {
        //         data: plot,
        //         maxHeight: '100vh',
        //         maxWidth: '100vw',
        //     },
        // );
    }

    idOfPlot(plot: Plot): number {
        return plot.id;
    }

    isLoading(loadingState: LoadingState): boolean {
        return (loadingState === LoadingState.LOADING);
    }

    isOk(loadingState: LoadingState): boolean {
        return (loadingState === LoadingState.OK);
    }

    isError(loadingState: LoadingState): boolean {
        return (loadingState === LoadingState.ERROR);
    }
}
