import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {ProjectService} from '../project/project.service';

import moment from 'moment';

@Component({
    selector: 'wave-time-ribbon',
    template: `
    <div layout="row">
        <md-input placeholder="year" type="number" maxLength="4"
            [ngModel]="moment.year()" (ngModelChange)="updateYear($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
        <md-input placeholder="month" type="number" maxLength="2"
            [ngModel]="moment.month()" (ngModelChange)="updateMonth($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
        <md-input placeholder="day" type="number" maxLength="2"
            [ngModel]="moment.date()" (ngModelChange)="updateDate($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
    </div>
    <div layout="row">
        <md-input placeholder="hour" type="number" maxLength="4"
            [ngModel]="moment.hour()" (ngModelChange)="updateHour($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
        <md-input placeholder="minute" type="number" maxLength="2"
            [ngModel]="moment.minute()" (ngModelChange)="updateMinute($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
        <md-input placeholder="second" type="number" maxLength="2"
            [ngModel]="moment.second()" (ngModelChange)="updateSecond($event)"
            (wheel)="$event.stopPropagation()"
        ></md-input>
    </div>
    `,
    styles: [`
    md-input {
        margin-bottom: 2px;
    }
    md-input {
        width: 60px;
    }

    md-input >>> .md-errors-spacer {
        display: none;
    }
    `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeRibbonComponent implements OnInit {

    private moment: moment.Moment;

    constructor(private projectService: ProjectService) {}

    updateYear(event: string | number) {
        this.moment.year(this.eventToNumber(event));
        this.push();
    }
    updateMonth(event: string | number) {
        this.moment.month(this.eventToNumber(event));
        this.push();
    }
    updateDate(event: string | number) {
        this.moment.date(this.eventToNumber(event));
        this.push();
    }
    updateHour(event: string | number) {
        this.moment.hour(this.eventToNumber(event));
        this.push();
    }
    updateMinute(event: string | number) {
        this.moment.minute(this.eventToNumber(event));
        this.push();
    }
    updateSecond(event: string | number) {
        this.moment.second(this.eventToNumber(event));
        this.push();
    }

    ngOnInit() {
        this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.moment)) {
                this.moment = time.clone();
                // console.log("wave-time-ribbon", "projectService changed", this.moment);
            }
        });
    }

    private eventToNumber(event: string | number): number {
        if (typeof event === 'string') {
            if ( event === '' ) {
                return 0;
            }
            return parseInt(event, 10);
        }
        if (typeof event === 'number') {
            return event;
        }
        return 0;
    }

    private push() {
        if (this.moment.isValid()) {
            this.projectService.setTime(this.moment.clone());
        }
    }
}
