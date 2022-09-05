import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';

@Component({
    selector: 'geoengine-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {}
}
