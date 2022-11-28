import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'geoengine-not-found-page',
    templateUrl: './not-found-page.component.html',
    styleUrls: ['./not-found-page.component.scss'],
})
export class NotFoundPageComponent implements OnInit {
    constructor(private router: Router) {}

    ngOnInit(): void {}

    goBack(): void {
        this.router.navigate(['/']);
    }
}
