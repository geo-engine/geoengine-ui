import {Component, OnInit, ChangeDetectionStrategy, Type} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {OperatorRepositoryComponent} from '../../../components/operator-repository.component';
import {LoginComponent} from '../../users/login/login.component';
import {HelpComponent} from '../../help.component';
import {TimeConfigComponent} from '../../time-config/time-config.component';
import {PlotListComponent} from '../../plots/plot-list/plot-list.component';
import {WorkspaceSettingsComponent} from '../../project/workspace-settings/workspace-settings.component';

@Component({
    selector: 'wave-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent implements OnInit {

    // make available
    SourceOperatorListComponent = SourceOperatorListComponent;
    OperatorRepositoryComponent = OperatorRepositoryComponent;
    LoginComponent = LoginComponent;
    HelpComponent = HelpComponent;
    TimeConfigComponent = TimeConfigComponent;
    PlotListComponent = PlotListComponent;
    WorkspaceSettingsComponent = WorkspaceSettingsComponent;

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

    buttonColor(componentSelection: [Type<Component>, Type<Component>], component: Type<Component>): string {
        if (!componentSelection) {
            return 'default';
        }

        const [selectedComponent, backButtonComponent] = componentSelection;
        if (selectedComponent === component || backButtonComponent === component) {
            return 'primary';
        } else {
            return 'default';
        }
    }

}
