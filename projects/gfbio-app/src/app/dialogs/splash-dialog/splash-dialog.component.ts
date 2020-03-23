import {Component, ChangeDetectionStrategy, Inject} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';

import {UserService} from 'wave-core';

import {GFBioUserService} from '../../users/user.service';

@Component({
    selector: 'wave-gfbio-splash-dialog',
    templateUrl: './splash-dialog.component.html',
    styleUrls: ['./splash-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashDialogComponent {

    constructor(@Inject(UserService) private readonly userService: GFBioUserService) {
    }

    changeTick(event: MatCheckboxChange) {
        this.userService.setIntroductoryPopup(!event.checked);
    }

}
