import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
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
            [ngModel]="moment.month()+1" (ngModelChange)="updateMonth($event-1)"
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

    constructor(
        private projectService: ProjectService,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    updateYear(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.year(value);
            this.push();
        }
    }
    updateMonth(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.month(value);
            this.push();
        }
    }
    updateDate(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.date(value);
            this.push();
        }
    }
    updateHour(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.hour(value);
            this.push();
        }
    }
    updateMinute(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.minute(value);
            this.push();
        }
    }
    updateSecond(event: string | number) {
        const value = this.eventToNumber(event);
        if ( value && !isNaN(value)) {
            this.moment.second(value);
            this.push();
        }
    }

    ngOnInit() {
        this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.moment)) {
                this.moment = time.clone();
                this.changeDetectorRef.markForCheck();
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
        return NaN;
    }

    private push() {
        if (this.moment.isValid() && this.moment !== undefined) {
            this.projectService.setTime(this.moment.clone());
        }
    }
}
