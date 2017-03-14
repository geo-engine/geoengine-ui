import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';
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

    plot: Plot;

    maxWidth$ = new BehaviorSubject<number>(undefined);
    maxHeight$ = new BehaviorSubject<number>(undefined);

    constructor(private dialogRef: MdDialogRef<PlotDetailViewComponent>,
                public projectService: ProjectService,
                private elementRef: ElementRef) {
    }

    ngOnInit() {
        this.plot = this.dialogRef.config.data;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            let dialogContainer = undefined;
            let parent = this.elementRef.nativeElement.parentElement;
            while (!dialogContainer) {
                dialogContainer = parent.querySelector('md-dialog-container');
                parent = parent.parentElement;
            }

            const width = parseInt(getComputedStyle(dialogContainer).maxWidth, 10) - 2 * LayoutService.remInPx();
            const maxHeight = window.innerHeight * 0.8;

            this.maxWidth$.next(width);
            this.maxHeight$.next(maxHeight);
        });
    }

}
