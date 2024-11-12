import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {CoreConfig, CoreModule} from '@geoengine/core';
import {DataSelectionService} from './data-selection.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CoreModule, DashboardComponent],
    providers: [DataSelectionService],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'esg-indicator-service';

    config = inject(CoreConfig);
}
