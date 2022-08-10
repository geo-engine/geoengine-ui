import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

@Component({
    selector: 'wave-gfbio-splash-dialog',
    templateUrl: './splash-dialog.component.html',
    styleUrls: ['./splash-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashDialogComponent implements OnInit {
    splashName = 'showStartupSplashScreen';

    constructor() {}

    ngOnInit(): void {}
}
