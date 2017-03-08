import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit} from '@angular/core';
import {ProjectService} from '../../project/project.service';
import {BehaviorSubject} from 'rxjs/Rx';
import {LoadingState} from '../../project/loading-state.model';
import {MdDialog} from '@angular/material';
import {PlotDetailViewComponent} from '../plot-detail-view/plot-detail-view.component';

@Component({
    selector: 'wave-plot-list',
    templateUrl: './plot-list.component.html',
    styleUrls: ['./plot-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotListComponent implements OnInit, AfterViewInit {

    LoadingState = LoadingState;
    PlotDetailViewComponent = PlotDetailViewComponent;

    cardWidth$: BehaviorSubject<number> = new BehaviorSubject(undefined);

    constructor(public projectService: ProjectService,
                public dialog: MdDialog,
                private elementRef: ElementRef) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        const cardContent = this.elementRef.nativeElement.querySelector('md-card');
        setTimeout(() => this.cardWidth$.next(parseInt(getComputedStyle(cardContent).width, 10)));
    }

}
