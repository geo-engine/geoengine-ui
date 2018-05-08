import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {BehaviorSubject, Subscription} from 'rxjs/Rx';
import {LoadingState} from '../../project/loading-state.model';
import {MatDialog} from '@angular/material';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {RScriptType} from '../../operators/types/r-script-type.model';
import {BoxPlotType} from '../../operators/types/boxplot-type.model';
import {ScatterPlotType} from '../../operators/types/scatterplot-type.model';
import {PieChartType} from '../../operators/types/piechart-type.model';
import {TimePlotType} from '../../operators/types/timeplot-type.model';
import {LayoutService} from '../../layout.service';
import {ROperatorComponent} from '../../operators/dialogs/r/r-operator/r-operator.component';
import {Plot} from '../plot.model';
import {OperatorListComponent} from '../../operators/dialogs/operator-list/operator-list.component';

@Component({
    selector: 'wave-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotListComponent implements OnInit, AfterViewInit, OnDestroy {

    // make available
    RScriptType = RScriptType;
    ScatterPlotType = ScatterPlotType;
    PieChartType = PieChartType;
    BoxPlotType = BoxPlotType;
    TimePlotType = TimePlotType;
    //
    // to distinguish some r-script operators out of the editable ones.
    editExceptions = [this.ScatterPlotType.NAME, this.PieChartType.NAME, this.BoxPlotType.NAME, this.TimePlotType.NAME];
    LoadingState = LoadingState;
    cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);
    private subsriptions: Array<Subscription> = [];

    constructor(public projectService: ProjectService,
                private layoutService: LayoutService,
                public dialog: MatDialog,
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
                        const cardContent = this.elementRef.nativeElement.querySelector('mat-card');
                        const width = parseInt(getComputedStyle(cardContent).width, 10);
                        this.cardWidth$.next(width);
                    });
                })
        );
    }

    ngOnDestroy() {
        this.subsriptions.forEach(subscription => subscription.unsubscribe());
    }

    editRPlot(plot: Plot) {
        this.layoutService.setSidenavContentComponent({
            component: ROperatorComponent,
            parent: PlotListComponent,
            config: {
                editable: plot,
            }
        });
    }

    goToOperatorsTab() {
        this.layoutService.setSidenavContentComponent({
            component: OperatorListComponent,
        });
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
