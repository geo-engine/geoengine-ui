import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute, ParamMap} from '@angular/router';

@Component({
    selector: 'geoengine-error-page',
    templateUrl: './error-page.component.html',
    styleUrls: [],
})
export class ErrorPageComponent implements OnInit {
    public error: string | undefined;
    public error_details: string | undefined;

    constructor(private route: ActivatedRoute, private router: Router) {}

    ngOnInit(): void {
        this.error = this.route.snapshot.paramMap.get('error')!;
        this.error_details = this.route.snapshot.paramMap.get('error_details')!;
    }
}
