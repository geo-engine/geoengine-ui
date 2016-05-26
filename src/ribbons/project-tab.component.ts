import {Component, ChangeDetectionStrategy} from '@angular/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {ProjectService} from '../services/project.service';
import {LayerService} from '../services/layer.service';

// import {OperatorGraphDialogComponent, OperatorGraphDialogConfig}
//   from '../components/dialogs/operator-graph.component';
// import {ProjectSettingsComponent, ProjectSettingsDialogConfig}
//   from '../components/project-settings.component';

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
                            (click)="showProjectSettingsDialog()">
                        <i md-icon>settings</i>
                        <div>Configuration</div>
                    </button>
                </div>
                <div layout="column" layout-align="space-around center">
                    <button md-button style="margin: 0px; height: auto;"
                            class="md-primary" layout="column"
                            (click)="showLineage()">
                        <i md-icon>merge_type</i>
                        <div>Lineage</div>
                    </button>
                </div>
            </div>
        </fieldset>

    </md-content>
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
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabComponent {
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
    //
    // /**
    //  * Show lineage information for the whole project.
    //  */
    // showLineage() {
    //     const config = new OperatorGraphDialogConfig()
    //         .layerService(this.layerService)
    //         .selectedLayerOnly(false)
    //         .clickOutsideToClose(true);
    //
    //     this.mdDialog.open(OperatorGraphDialogComponent, this.elementRef, config);
    // }
}
