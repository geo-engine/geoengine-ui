import {Component, ChangeDetectionStrategy} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {ChangeSpatialReferenceComponent} from '../change-spatial-reference/change-spatial-reference.component';
import {NewProjectComponent} from '../new-project/new-project.component';
import {LoadProjectComponent} from '../load-project/load-project.component';
import {SaveProjectAsComponent} from '../save-project-as/save-project-as.component';
import {NotificationsComponent} from '../notifications/notifications.component';

@Component({
    selector: 'geoengine-workspace-settings',
    templateUrl: './workspace-settings.component.html',
    styleUrls: ['./workspace-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class WorkspaceSettingsComponent {
    constructor(protected layoutService: LayoutService) {}

    loadSpatialReferenceDialog(): void {
        this.layoutService.setSidenavContentComponent({component: ChangeSpatialReferenceComponent, keepParent: true});
    }

    loadNewProjectDialog(): void {
        this.layoutService.setSidenavContentComponent({component: NewProjectComponent, keepParent: true});
    }

    loadChangeProjectDialog(): void {
        this.layoutService.setSidenavContentComponent({component: LoadProjectComponent, keepParent: true});
    }

    loadSaveAsDialog(): void {
        this.layoutService.setSidenavContentComponent({component: SaveProjectAsComponent, keepParent: true});
    }

    loadNotificationsDialog(): void {
        this.layoutService.setSidenavContentComponent({component: NotificationsComponent, keepParent: true});
    }
}
