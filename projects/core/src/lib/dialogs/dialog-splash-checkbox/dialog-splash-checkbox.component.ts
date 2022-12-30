import {Component, Input, OnInit} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {UserService} from '../../users/user.service';

@Component({
    selector: 'geoengine-dialog-splash-checkbox',
    templateUrl: './dialog-splash-checkbox.component.html',
    styleUrls: ['./dialog-splash-checkbox.component.scss'],
})
export class DialogSplashCheckboxComponent implements OnInit {
    /**
     * The name is used as the key in LocalStorage.
     */
    @Input() splashScreenName!: string;

    constructor(private readonly userService: UserService) {}

    ngOnInit(): void {}

    changeCheckbox(event: MatCheckboxChange): void {
        this.userService.saveSettingInLocalStorage(this.splashScreenName, JSON.stringify(!event.checked));
    }
}
