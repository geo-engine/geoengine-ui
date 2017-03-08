import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {UserService} from '../../users/user.service';
import {MdCheckboxChange} from '@angular/material';

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

    changeTick(event: MdCheckboxChange) {
        this.userService.setIntroductoryPopup(!event.checked);
    }

}
