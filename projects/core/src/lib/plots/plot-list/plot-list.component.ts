import {BehaviorSubject, Subscription} from 'rxjs';
import {filter, first} from 'rxjs/operators';

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy} from '@angular/core';

import {OperatorListComponent} from '../../operators/dialogs/operator-list/operator-list.component';
import {ProjectService} from '../../project/project.service';
import {LayoutService} from '../../layout.service';
import {LoadingState} from '../../project/loading-state.model';
import {Plot} from '@geoengine/common';

/**
 * This component lists all current plots.
 */
@Component({
    selector: 'geoengine-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class PlotListComponent implements AfterViewInit, OnDestroy {
    /**
     * If the list is empty, show the following button.
     */
    @Input() operatorsListConfig = {component: OperatorListComponent};

    readonly cardWidth$ = new BehaviorSubject<number | undefined>(undefined);

    readonly defaultLoadingState = LoadingState.LOADING;

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(
        public readonly projectService: ProjectService,
        private readonly layoutService: LayoutService,
        private readonly elementRef: ElementRef,
    ) {}

    ngAfterViewInit(): void {
        this.subscriptions.push(
            this.projectService
                .getPlotStream()
                .pipe(
                    filter((plots) => plots.length > 0),
                    first(),
                )
                .subscribe(() => {
                    setTimeout(() => {
                        const cardContent = this.elementRef.nativeElement.querySelector('mat-card-content');
                        const width = parseInt(getComputedStyle(cardContent).width, 10);
                        this.cardWidth$.next(width);
                    });
                }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    /**
     * Loads the component in `operatorsListConfig` into the sidenav
     */
    goToOperatorsTab(): void {
        this.layoutService.setSidenavContentComponent(this.operatorsListConfig);
    }

    idOfPlot(index: number, plot: Plot): number {
        return plot.id;
    }
}
