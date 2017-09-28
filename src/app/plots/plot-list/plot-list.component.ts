import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {BehaviorSubject, Subscription} from 'rxjs/Rx';
import {LoadingState} from '../../project/loading-state.model';
import {MdDialog} from '@angular/material';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {RScriptType} from '../../operators/types/r-script-type.model';
import {ScatterPlotType} from '../../operators/types/scatterplot-type.model';
import {PieChartType} from '../../operators/types/piechart-type.model';
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
    //

    LoadingState = LoadingState;
    PlotDetailViewComponent = PlotDetailViewComponent;

    cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);

    // to distinguish some r-script operators out of the editable ones.
    editExceptions = [this.ScatterPlotType.NAME, this.PieChartType.NAME];

    private subsriptions: Array<Subscription> = [];

    constructor(public projectService: ProjectService,
                private layoutService: LayoutService,
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

    editRPlot(plot: Plot) {
        this.layoutService.setSidenavContentComponent({
            component: ROperatorComponent,
            parent: PlotListComponent,
            config: {
                editable: plot,
            }
        });
    }

}
