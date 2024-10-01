import {OnInit} from '@angular/core';
import {Component, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
    constructor(
        private readonly vcRef: ViewContainerRef,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.router.initialNavigation();
    }
}
