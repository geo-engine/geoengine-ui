import {Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {DataSet} from 'vis-data/esnext';
import {DateType, Timeline} from 'vis-timeline/esnext';
import {ElementRef} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {ProjectService} from '../../project/project.service';
import moment, {DurationInputArg2} from 'moment';
import {Subscription} from 'rxjs';
import {Time} from '../time.model';
import {Layer} from '../../layers/layer.model';

@Component({
    selector: 'wave-time-slider',
    templateUrl: './time-slider.component.html',
    styleUrls: ['./time-slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeSliderComponent implements OnInit, OnDestroy {
    //Timeline Data for vis-timeline
    timeline: Timeline | undefined;
    options: any;
    data: any;
    groups: any;

    //Time Data
    startTime: DateType = new Date();
    endTime: DateType = new Date();
    timeScale: {value: DurationInputArg2; text: string}[] = [
        {value: 'hour', text: 'Hours'},
        {value: 'day', text: 'Days'},
        {value: 'month', text: 'Months'},
        {value: 'year', text: 'Years'},
    ];
    selectedScale: DurationInputArg2 = 'year';
    isRange = true;

    //Layer Data
    layerList: Array<Layer> = [];

    @ViewChild('timeline', {static: true}) timelineContainer!: ElementRef;

    // inventory of used subscriptions
    private subscriptions: Array<Subscription> = [];

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly layoutService: LayoutService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {
        this.subscriptions.push(
            this.projectService.getLayerStream().subscribe((layerList) => {
                if (layerList !== this.layerList) {
                    this.layerList = layerList;
                }
                this.changeDetectorRef.markForCheck();
            }),
        );
    }

    ngOnInit(): void {
        this.getTimelineData();
        this.getTimelineGroups();
        this.getOptions();

        this.timeline = new Timeline(this.timelineContainer.nativeElement, this.data, this.options);
        this.timeline.setGroups(this.groups);
        this.timeline.setItems(this.data);

        this.timeline.addCustomTime(this.startTime, 'start');
        this.timeline.addCustomTime(this.endTime, 'end');

        //listens to events of the custom timebars
        this.timeline.on('timechanged', (properties) => {
            if (properties.id === 'start') {
                this.startTime = this.timeline?.getCustomTime(properties.id) as Date;
            }
            if (properties.id === 'end') {
                this.endTime = this.timeline?.getCustomTime(properties.id) as Date;
            }
            if (!this.isRange) {
                this.endTime = this.startTime;
            }
            this.changeTime();
        });

        this.timeline.on('rangechanged', (properties) => {
            const startWindow = properties.start;
            const endWindow = properties.end;
            const windowSize = endWindow - startWindow;
            this.changeSelectedScale(windowSize);
        });

        //Connection to the timestream of the project
        //changes the position of the Timebars according to the Timestream of the project
        this.subscriptions.push(
            this.projectService.getTimeStream().subscribe((t) => {
                this.startTime = t.start.toDate();
                this.endTime = t.end.toDate();
                this.changeDetectorRef.markForCheck();
                if (this.isRange) {
                    this.timeline?.removeCustomTime('end');
                    this.isRange = false;
                }
                if (t.end.isAfter(t.start)) {
                    this.timeline?.addCustomTime(t.end.toDate(), 'end');
                    this.isRange = true;
                }
                this.timeline?.setCustomTime(t.start.toDate(), 'start');
            }),
        );
    }

    changeSelectedScale(windowSize: number): void {
        if (windowSize > 1000 * 60 * 60 * 24 * 31 * 22) this.selectedScale = 'year';
        else if (windowSize > 1000 * 60 * 60 * 24 * 15) this.selectedScale = 'month';
        else if (windowSize > 1000 * 60 * 60 * 31) this.selectedScale = 'day';
        else this.selectedScale = 'hour';
    }

    //changes the Timestream of the project according to the Timebars
    changeTime(): void {
        this.projectService.getTimeOnce().subscribe(() => {
            const updatedTime = new Time(moment(this.startTime), moment(this.endTime));
            this.projectService.setTime(updatedTime);
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.timeline?.off('timechanged');
    }

    centerTimeline(): void {
        this.timeline?.moveTo(this.startTime);
    }

    changeScale(selectedScale: DurationInputArg2): void {
        this.projectService.getTimeOnce().subscribe((t) => {
            const startWindow = t.start.clone().subtract(4, selectedScale);
            const endWindow = t.start.clone().add(4, selectedScale);
            this.timeline?.setWindow(startWindow, endWindow);
        });
    }

    //every group represents one layer
    getTimelineGroups(): void {
        this.groups = new DataSet([]);
        for (const layer of this.layerList) {
            this.groups.add({
                id: layer.id,
                content: layer.name,
            });
        }
    }

    //every group (layer) can hav multiple data points
    //ToDo: implement the availability of the layers
    getTimelineData(): void {
        this.data = new DataSet();
        for (const layer of this.layerList) {
            this.data.add({
                id: layer.id,
                group: layer.id,
                content: '',
                //     type: 'point' or 'background',
                start: '2012-01',
                end: '2025-01',
            });
        }
    }

    //options for the timeline
    getOptions(): void {
        this.options = {
            moment: (date: Date) => moment(date).utc(), //use utc
            start: '2012-01',
            end: '2020-01',
            orientation: 'top',
            height: 150,
            itemsAlwaysDraggable: false,
            editable: true,
            selectable: false,
            margin: {
                axis: 5,
            },
            showMajorLabels: true,
            showMinorLabels: true,
            showCurrentTime: false,
            zoomMin: 1000 * 60 * 60 * 12, // one day in milliseconds
            zoomMax: 1000 * 60 * 60 * 24 * 31 * 12 * 20, // twenty years in milliseconds
        };
    }
}
