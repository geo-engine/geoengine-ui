import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

import {ProjectService} from '../app/project/project.service';
import {Project} from '../app/project/project.model';
import {Projection, Projections} from '../app/operators/projection.model';

import * as moment from 'moment';

@Component({
    selector: 'wave-project-settings',
    template: `
    <form>
        <input mdInput placeholder="Name" disabled [(ngModel)]="project.name">
        <p>Set the projection for reviewing and exporting:</p>
        <div class="select">
            <label>Projection</label>
            <select [(ngModel)]="projection">
                <option *ngFor="let projection of Projections.ALL_PROJECTIONS"
                        [ngValue]="projection"
                >{{projection}}</option>
            </select>
        </div>
        <!---->
        <p>This is the currently visible timestamp:</p>
        <input mdInput placeholder="Date/Time" disabled [(ngModel)]="time">
    </form>
    `,
    styles: [`
    form {
        padding-top: 16px;
    }
    div.select {
        margin-top: 25px;
    }
    label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ProjectSettingsComponent implements OnInit {
    // make it available for template
    Projections = Projections; // tslint:disable-line:variable-name

    private project: Project;

    private projection: Projection;
    private time: string;

    constructor(
        private projectService: ProjectService
    ) {
        // super();

        this.project = this.projectService.getProject();
        this.projection = this.project.projection;
        this.time = this.project.time.toISOString();
    }

    ngOnInit() {
        // this.dialog.setTitle('Project Settings');
        // this.dialog.setButtons([
        //     { title: 'Save', class: 'md-primary', action: () => this.save() },
        //     { title: 'Cancel', action: () => this.dialog.close() },
        // ]);
    }

    save() {
        const newTime: moment.Moment = moment(this.time);
        const useTime: boolean = (newTime.isValid() && !this.project.time.isSame(newTime));

        if (this.project.projection !== this.projection || useTime) {
            this.projectService.changeProjectConfig({
                projection: this.projection,
                time: (useTime) ? newTime : this.project.time,
            });
        }
        // this.dialog.close();
    }

}
