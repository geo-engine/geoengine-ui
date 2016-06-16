import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {ProjectService} from '../project/project.service';
import {LayerService} from '../layers/layer.service';
import {UserService} from '../users/user.service';

import {DialogLoaderComponent} from '../dialogs/dialog-loader.component';
import {SaveAsDialogComponent} from '../storage/save-as.component';
import {LoadDialogComponent} from '../storage/load.component';
import {OperatorGraphDialogComponent} from '../layers/dialogs/operator-graph.component';
import {ProjectSettingsComponent} from '../project/project-settings.component';

/**
 * The project tab of the ribbons component.
 */
@Component({
    selector: 'wave-project-tab',
    template: `
    <md-content layout="row">
        <fieldset>
            <legend>Storage</legend>
            <div layout="row" layout-align="center">
                <button md-button
                    class="md-primary" layout="column space-around"
                    disabled>
                    <i md-icon>save</i>
                    <div>Save (autosave)</div>
                </button>
                <button md-button
                    class="md-primary" layout="column space-around"
                    [disabled]="isGuestUser$ | async"
                    (click)="saveAsDialog.show()"
                >
                    <i md-icon>archive</i>
                    <div>Save as...</div>
                </button>
                <button md-button
                    class="md-primary" layout="column space-around"
                    [disabled]="isGuestUser$ | async"
                    (click)="loadDialog.show()"
                >
                    <i md-icon>unarchive</i>
                    <div>Load</div>
                </button>
            </div>
        </fieldset>
        <fieldset>
            <legend>Project</legend>
            <div layout="row" layout-align="center">
                    <button md-button
                            class="md-primary" layout="column space-around"
                            (click)="projectSettingsDialog.show()">
                        <i md-icon>settings</i>
                        <div>Configuration</div>
                    </button>
                    <button md-button
                            class="md-primary" layout="column space-around"
                            (click)="lineageDialog.show()">
                        <i md-icon>merge_type</i>
                        <div>Lineage</div>
                    </button>
            </div>
        </fieldset>
    </md-content>
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
    `,
    styles: [`
    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
        height: 125px;
    }
    fieldset > div {
        height: 105px;
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
        margin: 0px;
        height: auto;
    }
    button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES, DialogLoaderComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabComponent {
    // make this available in the template
    // tslint:disable:variable-name
    SaveAsDialogComponent = SaveAsDialogComponent;
    LoadDialogComponent = LoadDialogComponent;
    OperatorGraphDialogComponent = OperatorGraphDialogComponent;
    ProjectSettingsComponent = ProjectSettingsComponent;
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
