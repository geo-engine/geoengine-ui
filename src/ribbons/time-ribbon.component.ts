import {Component, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";

import {ProjectService} from "../services/project.service";

import moment from "moment";

@Component({
    selector: "wave-time-ribbon",
    template: `
    <div layout="row">
         <md-input-container class="md-block">
           <label>year</label>
           <input md-input type="number" maxLength="4" [value]="moment.year()" (valueChange)="updateYear($event)">
         </md-input-container>
         <md-input-container class="md-block">
           <label>month</label>
           <input md-input type="number" maxLength="2" [value]="moment.month()"  (valueChange)="updateMonth($event)">
         </md-input-container>
         <md-input-container class="md-block">
           <label>day</label>
           <input md-input type="number" maxLength="2" [value]="moment.date()"  (valueChange)="updateDate($event)">
         </md-input-container>
       </div>
       <div layout="row">
            <md-input-container class="md-block">
              <label>hour</label>
              <input md-input type="number" maxLength="2" [value]="moment.hour()"  (valueChange)="updateHour($event)">
            </md-input-container>
            <md-input-container class="md-block">
              <label>minute</label>
              <input md-input type="number" maxLength="2" [value]="moment.minute()"  (valueChange)="updateMinute($event)">
            </md-input-container>
            <md-input-container class="md-block">
              <label>second</label>
              <input md-input type="number" maxLength="2" [value]="moment.second()"  (valueChange)="updateSecond($event)">
            </md-input-container>
          </div>
      `,
    styles: [`
        md-input-container {
            margin-bottom: 2px;
        }
        md-input-container input {
            width: 60px;
        }

        md-input-container >>> .md-errors-spacer {
            display: none;
        }
        `],
    directives: [MATERIAL_DIRECTIVES],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeRibbonComponent implements OnInit {

    // @Output("symbologyChanged") symbologyChangedEmitter: EventEmitter<RasterSymbology> = new EventEmitter<RasterSymbology>();
    private moment: moment.Moment;

    constructor(private projectService: ProjectService) {

    }

    private static eventToNumber(event: any): number {
        if (typeof(event) === "string") {
            if ( event === "" ) {
                return 0;
            }
            return parseInt(event);
        }
        if (typeof(event) === "number") {
            return event;
        }
        return 0;
    }

    updateYear(event: any) { this.moment.year(TimeRibbonComponent.eventToNumber(event)); this.push(); }
    updateMonth(event: any) { this.moment.month(TimeRibbonComponent.eventToNumber(event)); this.push(); }
    updateDate(event: any) { this.moment.date(TimeRibbonComponent.eventToNumber(event)); this.push(); }
    updateHour(event: any) { this.moment.hour(TimeRibbonComponent.eventToNumber(event)); this.push(); }
    updateMinute(event: any) { this.moment.minute(TimeRibbonComponent.eventToNumber(event)); this.push(); }
    updateSecond(event: any) { this.moment.second(TimeRibbonComponent.eventToNumber(event)); this.push(); }

    private push() {
        if (this.moment.isValid()) {
            this.projectService.setTime(this.moment.clone());
        }
    }

    ngOnInit() {
        this.projectService.getTimeStream().subscribe(time => {
            if (!time.isSame(this.moment)) {
                this.moment = time.clone();
                // console.log("wave-time-ribbon", "projectService changed", this.moment);
            }
        });
    }
}
