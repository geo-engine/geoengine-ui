import {APP_INITIALIZER, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {
    BackendService,
    Config,
    CoreModule,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    SpatialReferenceService,
    UserService,
} from '@geoengine/core';
import {DataSelectionService} from 'projects/dashboards/data-atlas/src/app/data-selection.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CoreModule, DashboardComponent],
    providers: [
        BackendService,
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        DataSelectionService,
        UserService,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'ecometrics';
}
