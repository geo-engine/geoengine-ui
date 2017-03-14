import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ChangeProjectionComponent} from '../change-projection/change-projection.component';
import {LayoutService} from '../../layout.service';

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
    //

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

}
