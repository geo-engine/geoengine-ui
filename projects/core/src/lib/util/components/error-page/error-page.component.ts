import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'geoengine-error-page',
    templateUrl: './error-page.component.html',
    styleUrls: [],
})
export class ErrorPageComponent implements OnInit {
    public error: string | null;
    public errorDetails: string | null;

    constructor(private route: ActivatedRoute, private router: Router) {
        this.error = null;
        this.errorDetails = null;
    }

    ngOnInit(): void {
        this.error = this.route.snapshot.paramMap.get('error');
        this.errorDetails = this.route.snapshot.paramMap.get('errorDetails');
    }
}
