import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {ProjectService} from '../project/project.service';
import {LayerService} from '../layers/layer.service';
import {UserService} from '../users/user.service';

import {SaveAsDialogComponent} from '../storage/save-as.component';
import {LoadDialogComponent} from '../storage/load.component';
import {OperatorGraphDialogComponent} from '../layers/dialogs/operator-graph.component';
import {ProjectSettingsComponent} from '../project/project-settings.component';
import {NewProjectDialogComponent} from '../project/new-project.component';

/**
 * The project tab of the ribbons component.
 */
@Component({
    selector: 'wave-project-tab',
    template: `
    <div class="ribbons flex-row">
        <fieldset>
            <legend>Storage</legend>
            <div class="flex-row flex-center">
                <button md-button
                    class="md-primary flex-column"
                    disabled>
                    <md-icon>save</md-icon>
                    <div>Save (autosave)</div>
                </button>
                <button md-button
                    class="md-primary flex-column"
                    [disabled]="isGuestUser$ | async"
                    (click)="saveAsDialog.show()"
                >
                    <md-icon>archive</md-icon>
                    <div>Save as...</div>
                </button>
                <button md-button
                    class="md-primary flex-column"
                    [disabled]="isGuestUser$ | async"
                    (click)="loadDialog.show()"
                >
                    <md-icon>unarchive</md-icon>
                    <div>Load</div>
                </button>
            </div>
        </fieldset>
        <fieldset>
            <legend>Project</legend>
            <div class="flex-row flex-center">
                <button md-button
                    class="md-primary flex-column"
                    [disabled]="isGuestUser$ | async"
                    (click)="newProjectDialog.show()"
                >
                    <md-icon>create_new_folder</md-icon>
                    <div>New</div>
                </button>
                <button md-button
                        class="md-primary flex-column"
                        (click)="projectSettingsDialog.show()">
                    <md-icon>settings</md-icon>
                    <div>Configuration</div>
                </button>
                <button md-button
                        class="md-primary flex-column"
                        (click)="lineageDialog.show()">
                    <md-icon>merge_type</md-icon>
                    <div>Lineage</div>
                </button>
            </div>
        </fieldset>
    </div>
    <wave-dialog-loader #saveAsDialog
        [type]="SaveAsDialogComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #loadDialog
        [type]="LoadDialogComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #lineageDialog
        [type]="OperatorGraphDialogComponent"
        [config]="{selectedLayerOnly: false}"
    ></wave-dialog-loader>
    <wave-dialog-loader #projectSettingsDialog
        [type]="ProjectSettingsComponent"
    ></wave-dialog-loader>
    <wave-dialog-loader #newProjectDialog
        [type]="NewProjectDialogComponent"
    ></wave-dialog-loader>
    `,
    styles: [`
    .ribbons {
      display: flex;
      flex: 1;
    }    
    .flex-row {
      display: flex;
      flex-direction: row;
      box-sizing: border-box;      
    }
    .flex-column {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;  
    }
    .flex-center {
      align-items: center;
    }

    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
        height: 125px;
    }
    fieldset > div {
        height: 105px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabComponent {
    // make this available in the template
    // tslint:disable:variable-name
    SaveAsDialogComponent = SaveAsDialogComponent;
    LoadDialogComponent = LoadDialogComponent;
    OperatorGraphDialogComponent = OperatorGraphDialogComponent;
    ProjectSettingsComponent = ProjectSettingsComponent;
    NewProjectDialogComponent = NewProjectDialogComponent;
    // tslint:enable

    isGuestUser$: Observable<boolean>;

    constructor(
        private projectService: ProjectService,
        private layerService: LayerService,
        private userService: UserService
    ) {
        this.isGuestUser$ = this.userService.isGuestUserStream();
    }

}
