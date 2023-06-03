import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'geoengine-not-found-page',
    templateUrl: './not-found-page.component.html',
    styleUrls: ['./not-found-page.component.scss'],
})
export class NotFoundPageComponent {
    constructor(private router: Router) {}

    goBack(): void {
        this.router.navigate(['/']);
    }
}
