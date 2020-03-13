import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ChangeProjectionComponent} from '../change-projection/change-projection.component';
import {LayoutService} from '../../layout.service';
import {NewProjectComponent} from '../new-project/new-project.component';
import {LoadProjectComponent} from '../load-project/load-project.component';
import {SaveProjectAsComponent} from '../save-project-as/save-project-as.component';

@Component({
    selector: 'wave-workspace-settings',
    templateUrl: './workspace-settings.component.html',
    styleUrls: ['./workspace-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceSettingsComponent implements OnInit {

    // make available
    Self = WorkspaceSettingsComponent;
    ChangeProjectionComponent = ChangeProjectionComponent;
    NewProjectComponent = NewProjectComponent;
    LoadProjectComponent = LoadProjectComponent;
    SaveProjectAsComponent = SaveProjectAsComponent;
    //

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

}
