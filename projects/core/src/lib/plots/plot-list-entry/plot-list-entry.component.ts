import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject} from '@angular/core';
import {PlotDataDict} from '../../backend/backend.model';
import {LoadingState} from '../../project/loading-state.model';
import {ProjectService} from '../../project/project.service';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';
import {MatDialog} from '@angular/material/dialog';
import {createIconDataUrl, GeoEngineError, Plot, CommonModule, FxLayoutDirective, FxFlexDirective} from '@geoengine/common';
import {MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions} from '@angular/material/card';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {JsonPipe} from '@angular/common';

@Component({
    selector: 'geoengine-plot-list-entry',
    templateUrl: './plot-list-entry.component.html',
    styleUrls: ['./plot-list-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCard,
        MatCardHeader,
        MatCardAvatar,
        MatCardTitle,
        MatCardSubtitle,
        MatCardContent,
        MatProgressSpinner,
        CommonModule,
        MatCardActions,
        FxLayoutDirective,
        MatIconButton,
        MatIcon,
        FxFlexDirective,
        JsonPipe,
    ],
})
export class PlotListEntryComponent implements OnChanges {
    private readonly projectService = inject(ProjectService);
    private readonly dialog = inject(MatDialog);

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
