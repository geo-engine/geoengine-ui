import {Component, Input} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-dialog-splash-checkbox',
    templateUrl: './dialog-splash-checkbox.component.html',
    styleUrls: ['./dialog-splash-checkbox.component.scss'],
})
export class DialogSplashCheckboxComponent {
    /**
     * The name is used as the key in LocalStorage.
     */
    @Input() splashScreenName!: string;

    constructor(private readonly userService: UserService) {}

    changeCheckbox(event: MatCheckboxChange): void {
        this.userService.saveSettingInLocalStorage(this.splashScreenName, JSON.stringify(!event.checked));
    }
}
