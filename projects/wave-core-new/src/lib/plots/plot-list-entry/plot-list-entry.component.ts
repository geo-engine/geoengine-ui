import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PlotDataDict} from '../../backend/backend.model';
import {Plot} from '../plot.model';
import {LoadingState} from '../../project/loading-state.model';
import {createIconDataUrl} from '../../util/icons';
import {ProjectService} from '../../project/project.service';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'wave-plot-list-entry',
    templateUrl: './plot-list-entry.component.html',
    styleUrls: ['./plot-list-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListEntryComponent implements OnInit, OnChanges {

    @Input()
    plot: Plot;

    @Input()
    plotStatus: LoadingState;

    @Input()
    plotData: PlotDataDict;

    @Input()
    width: number;

    plotIcon: string;

    isLoading = true;
    isOk = false;
    isError = false;

    constructor(private readonly projectService: ProjectService,
                private readonly dialog: MatDialog) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.plotData && this.plotData) {
            this.plotIcon = createIconDataUrl(this.plotData.plot_type);
        }

        if (changes.plotStatus) {
            this.isLoading = this.plotStatus === LoadingState.LOADING;
            this.isOk = this.plotStatus === LoadingState.OK;
            this.isError = this.plotStatus === LoadingState.ERROR;
        }
    }

    /**
     * Show a plot as a fullscreen modal dialog
     */
    showFullscreen() {
        this.dialog.open(
            PlotDetailViewComponent,
            {
                data: this.plot,
                maxHeight: '100vh',
                maxWidth: '100vw',
            },
        );
    }

    removePlot() {
        this.projectService.removePlot(this.plot);
    }

    reloadPlot() {
        this.projectService.reloadPlot(this.plot);
    }
}
