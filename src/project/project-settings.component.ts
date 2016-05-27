import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';

import {ProjectService} from '../services/project.service';

import {Project} from '../models/project.model';
import {Projection, Projections} from '../operators/projection.model';

import moment from 'moment';

@Component({
    selector: 'wave-project-settings',
    template: `
    <form>
        <md-input placeholder="Name" [(ngModel)]="projectName"></md-input>
        <p>Set the projection for reviewing and exporting:</p>
        <!--<md-input placeholder="Working Projection">-->
        <div class="select">
            <select [(ngModel)]="workingProjection">
                <option *ngFor="let projection of Projections.ALL_PROJECTIONS"
                        [ngValue]="projection"
                >{{projection}}</option>
            </select>
            <label>Working Projection</label>
        </div>
        <!--</md-input>-->
        <p>This is the currently visible timestamp:</p>
        <md-input placeholder="Date/Time" disabled [(ngModel)]="time"></md-input>
    </form>
    `,
    styles: [`
    div.select {
        margin-top: 25px;
    }
    label {
        display: block;
        font-size: 12px;
        transform: translateY(-300%);
        color: rgba(0, 0, 0, 0.38);
    }
    `],
    directives: [COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ProjectSettingsComponent extends DefaultBasicDialog implements OnInit {
    // make it available for template
    Projections = Projections; // tslint:disable-line:variable-name

    private project: Project;

    private projectName: string;
    private workingProjection: Projection;
    private mapProjection: Projection;
    private time: string;

    constructor(
        private projectService: ProjectService
    ) {
        super();

        this.project = this.projectService.getProject();
        this.workingProjection = this.project.workingProjection;
        this.mapProjection = this.project.mapProjection;
        this.projectName = this.project.name;
        this.time = this.project.time.toISOString();
    }

    ngOnInit() {
        this.dialog.setTitle('Project Settings');
        this.dialog.setButtons([
            { title: 'Cancel', action: () => this.dialog.close() },
            { title: 'Save', class: 'md-primary', action: () => this.save() },
        ]);
    }

    save() {
        const newTime: moment.Moment = moment(this.time);
        const useTime: boolean = (newTime.isValid() && !this.project.time.isSame(newTime));

        if (this.project.name !== this.projectName
            || this.project.workingProjection !== this.workingProjection
            || this.project.mapProjection !== this.mapProjection
            || useTime
        ) {
            this.projectService.changeProjectConfig({
                name: this.projectName,
                workingProjection: this.workingProjection,
                mapProjection: this.mapProjection,
                time: (useTime) ? newTime : this.project.time,
            });
        }
        this.dialog.close();
    }

}
