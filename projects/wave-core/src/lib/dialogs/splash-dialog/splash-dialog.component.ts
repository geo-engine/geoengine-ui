import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {UserService} from '../../users/user.service';
import {MatCheckboxChange} from '@angular/material/checkbox';

@Component({
  selector: 'wave-splash-dialog',
  templateUrl: './splash-dialog.component.html',
  styleUrls: ['./splash-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashDialogComponent {

    constructor(
        private userService: UserService
    ) {}

    changeTick(event: MatCheckboxChange) {
        this.userService.setIntroductoryPopup(!event.checked);
    }

}
