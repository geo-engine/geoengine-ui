import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {PlotDataDict} from '../../backend/backend.model';
import {LoadingState} from '../../project/loading-state.model';
import {ProjectService} from '../../project/project.service';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {MatDialog} from '@angular/material/dialog';
import {createIconDataUrl, GeoEngineError, Plot} from '@geoengine/common';

@Component({
    selector: 'geoengine-plot-list-entry',
    templateUrl: './plot-list-entry.component.html',
    styleUrls: ['./plot-list-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotListEntryComponent implements OnChanges {
    @Input()
    plot!: Plot;

    @Input()
    plotStatus?: LoadingState;

    @Input()
    plotData?: PlotDataDict;

    @Input()
    plotError?: GeoEngineError;

    @Input()
    width?: number;

    plotIcon?: string;

    isLoading = true;
    isOk = false;
    isError = false;

    constructor(
        private readonly projectService: ProjectService,
        private readonly dialog: MatDialog,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.plotData && this.plotData) {
            this.plotIcon = createIconDataUrl(this.plotData.outputFormat);
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
    showFullscreen(): void {
        this.dialog.open(PlotDetailViewComponent, {
            data: this.plot,
            maxHeight: '100vh',
            maxWidth: '100vw',
        });
    }

    removePlot(): void {
        this.projectService.removePlot(this.plot);
    }

    reloadPlot(): void {
        this.projectService.reloadPlot(this.plot);
    }
}
