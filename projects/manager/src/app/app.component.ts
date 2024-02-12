import {Component, ViewContainerRef} from '@angular/core';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    constructor(private readonly vcRef: ViewContainerRef) {}
}
