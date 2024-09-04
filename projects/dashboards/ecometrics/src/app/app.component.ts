import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {CoreConfig, CoreModule} from '@geoengine/core';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CoreModule, DashboardComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'ecometrics';

    config = inject(CoreConfig);
}
