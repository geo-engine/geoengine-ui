import {BehaviorSubject, Subscription} from 'rxjs';
import {first, filter} from 'rxjs/operators';

import {MatDialog} from '@angular/material/dialog';
import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';

import {BoxPlotType} from '../../operators/types/boxplot-type.model';
import {LayoutService} from '../../layout.service';
import {LoadingState} from '../../project/loading-state.model';
import {OperatorListComponent} from '../../operators/dialogs/operator-list/operator-list.component';
import {PieChartType} from '../../operators/types/piechart-type.model';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {Plot} from '../plot.model';
import {ProjectService} from '../../project/project.service';
import {ROperatorComponent} from '../../operators/dialogs/r/r-operator/r-operator.component';
import {RScriptType} from '../../operators/types/r-script-type.model';
import {ScatterPlotType} from '../../operators/types/scatterplot-type.model';
import {TimePlotType} from '../../operators/types/timeplot-type.model';

@Component({
    selector: 'wave-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() operatorsListConfig = {component: OperatorListComponent};

    readonly RScriptType = RScriptType;
    readonly ScatterPlotType = ScatterPlotType;
    readonly PieChartType = PieChartType;
    readonly BoxPlotType = BoxPlotType;
    readonly TimePlotType = TimePlotType;
    readonly LoadingState = LoadingState;

    // to distinguish some r-script operators out of the editable ones.
    readonly editExceptions = [this.ScatterPlotType.NAME, this.PieChartType.NAME, this.BoxPlotType.NAME, this.TimePlotType.NAME];
    readonly cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);

    private subscriptions: Array<Subscription> = [];

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

    editRPlot(plot: Plot) {
        this.layoutService.setSidenavContentComponent({
            component: ROperatorComponent,
            keepParent: true,
            config: {
                editable: plot,
            }
        });
    }

    goToOperatorsTab() {
        this.layoutService.setSidenavContentComponent(this.operatorsListConfig);
    }

    showFullscreen(plot: Plot) {
        this.dialog.open(
            PlotDetailViewComponent,
            {
                data: plot,
                maxHeight: '100vh',
                maxWidth: '100vw',
            },
        );
    }
}
