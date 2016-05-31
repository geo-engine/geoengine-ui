import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {ProjectService} from '../project/project.service';
import {LayerService} from '../layers/layer.service';

import {DialogLoaderComponent} from '../dialogs/dialog-loader.component';
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
            <legend>Project</legend>
            <div layout="row">
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="projectSettingsDialog.show()">
                        <i md-icon>settings</i>
                        <div>Configuration</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="lineageDialog.show()">
                        <i md-icon>merge_type</i>
                        <div>Lineage</div>
                    </button>
                </div>
            </div>
        </fieldset>

    </md-content>
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
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
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
    OperatorGraphDialogComponent = OperatorGraphDialogComponent;
    ProjectSettingsComponent = ProjectSettingsComponent;
    // tslint:enable

    constructor(
        private projectService: ProjectService,
        private layerService: LayerService
    ) {}

    // /**
    //  * Show the project settings dialog for the current project.
    //  */
    // showProjectSettingsDialog() {
    //     const config = new ProjectSettingsDialogConfig()
    //         .projectService(this.projectService)
    //         .clickOutsideToClose(true)
    //         .targetEvent(event);
    //
    //     this.mdDialog.open(ProjectSettingsComponent, this.elementRef, config);
    // }

}
