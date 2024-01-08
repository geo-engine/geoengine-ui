import {Component, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'geoengine-gfbio-splash-dialog',
    templateUrl: './splash-dialog.component.html',
    styleUrls: ['./splash-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashDialogComponent {
    static SPLASH_DIALOG_NAME = 'showStartupSplashScreen';

    get splashName(): string {
        return SplashDialogComponent.SPLASH_DIALOG_NAME;
    }
}
