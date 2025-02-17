import {OnInit, ViewContainerRef} from '@angular/core';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Location} from '@angular/common';
import {UserService} from '@geoengine/common';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: false,
})
export class AppComponent implements OnInit {
    constructor(
        private readonly vcRef: ViewContainerRef,
        private readonly router: Router,
        private readonly location: Location,
        private readonly userService: UserService,
    ) {}

    async ngOnInit(): Promise<void> {
        // wait for login to be completed before initializing the router
        await firstValueFrom(this.userService.getSessionOrUndefinedStream());

        if (window.location.search.length > 0) {
            // remove the query parameters before the hash from the url because they are not part of the app and cannot be removed later on
            // services can get the original query parameters from the `URLSearchParams` in their constructor which is called before the routing is initialized.
            const search = window.location.search;
            window.history.replaceState(null, '', window.location.pathname);
            this.location.go('/', search);
        }

        this.router.initialNavigation();
    }
}
