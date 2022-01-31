import {Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {DataSet} from 'vis-data/esnext';
import {DateType, Timeline} from 'vis-timeline/esnext';
import {ElementRef} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {ProjectService} from '../../project/project.service';
import moment from 'moment';
import {Subscription} from 'rxjs';
import {Time} from '../time.model';
import {Layer} from '../../layers/layer.model';

@Component({
    selector: 'wave-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnInit, OnDestroy {
    //Timeline Data for vis-timeline
    timeline: Timeline | undefined;
    options: any;
    data: any;
    groups: any;

    //Time Data
    startTime: DateType = new Date();
    endTime: DateType = new Date();

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
            this.changeTime();
        });

        //Connection to the timestream of the project
        this.subscriptions.push(
            this.projectService.getTimeStream().subscribe((t) => {
                this.startTime = t.start.toDate();
                this.endTime = t.end.toDate();
                this.changeDetectorRef.markForCheck();
                this.changeTimebar();
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    //changes the position of the Timebars according to the Timestream of the project
    changeTimebar(): void {
        this.timeline?.setCustomTime(this.startTime, 'start');
        this.timeline?.setCustomTime(this.endTime, 'end');
    }

    //changes the Timestream of the project according to the Timebars
    changeTime(): void {
        this.projectService.getTimeOnce().subscribe(() => {
            const updatedTime = new Time(moment(this.startTime), moment(this.endTime));
            this.projectService.setTime(updatedTime);
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
                //     type: 'point', oder type: 'background',
                start: '2014-03',
                end: '2015-03',
            });
        }
    }

    //options for the timeline
    getOptions(): void {
        this.options = {
            height: 150,
            stack: true,
            start: '2011-01', //timewindow that is shown at the beginning
            end: '2015-11',
            itemsAlwaysDraggable: false,
            editable: true,
            selectable: false,
            margin: {
                axis: 5,
            },
            showMajorLabels: true, //years
            showMinorLabels: false, //months
            orientation: 'top',
            timeAxis: {
                scale: 'month',
                step: 1,
            },
            showCurrentTime: false,
            zoomMax: 900000000000,
            zoomMin: 10000000000,
        };
    }
}
