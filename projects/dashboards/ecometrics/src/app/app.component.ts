import {APP_INITIALIZER, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {
    BackendService,
    CoreConfig,
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
import {CommonConfig} from '@geoengine/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CoreModule, DashboardComponent],
    providers: [
        {provide: CommonConfig, useExisting: CoreConfig},
        CoreConfig,
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
