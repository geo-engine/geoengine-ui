import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {ProjectService} from '../../project/project.service';
import {Plot} from '../plot.model';
import {BehaviorSubject} from 'rxjs/Rx';
import {LayoutService} from '../../layout.service';

@Component({
    selector: 'wave-plot-detail-view',
    templateUrl: './plot-detail-view.component.html',
    styleUrls: ['./plot-detail-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotDetailViewComponent implements OnInit, AfterViewInit {

    // plot: Plot;

    maxWidth$ = new BehaviorSubject<number>(undefined);
    maxHeight$ = new BehaviorSubject<number>(undefined);

    constructor(public projectService: ProjectService,
                private elementRef: ElementRef,
                @Inject(MAT_DIALOG_DATA) public plot: Plot) {
    }

    ngOnInit() {
        // this.plot = this.dialogRef.config.data;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            let dialogContainer = undefined;
            let parent = this.elementRef.nativeElement.parentElement;
            while (!dialogContainer) {
                dialogContainer = parent.querySelector('mat-dialog-container');
                parent = parent.parentElement;
            }

            const width = parseInt(getComputedStyle(dialogContainer).maxWidth, 10) - 2 * LayoutService.remInPx();

            let dialogContent = this.elementRef.nativeElement.querySelector('mat-dialog-content');

            const maxHeight = parseInt(getComputedStyle(dialogContent).maxHeight, 10) - 2 * LayoutService.remInPx();

            this.maxWidth$.next(width);
            this.maxHeight$.next(maxHeight);
        });
    }

}
