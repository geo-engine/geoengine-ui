import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MdToolbar} from '@angular2-material/toolbar';
import {MATERIAL_DIRECTIVES} from 'ng2-material';

import Config from '../app/config.model';

import {DialogLoaderComponent} from '../dialogs/dialog-loader.component';
import {LoginDialogComponent} from '../users/login-dialog.component';

import {UserService} from '../users/user.service';
import {LayoutService} from '../app/layout.service';

/**
 * The top left info area component for user info and layer list collapsing.
 */
@Component({
    selector: 'wave-info-area',
    template: `
    <md-toolbar class="md-accent">
        <button md-button aria-label="User" (click)="loginDialog.show()">
            <i md-icon>person</i>
            {{username$ | async}}
        </button>
        <span class="fill-remaining-space"></span>
        <button md-button class="md-icon-button" aria-label="Help">
            <i md-icon>help</i>
        </button>
        <md-toolbar-row class="title-bar">
            <md-divider></md-divider>
            <h1>WAVE</h1>
            <md-divider></md-divider>
        </md-toolbar-row>
        <md-toolbar-row>
            <button md-button class="md-icon-button" aria-label="Settings" disabled="true">
                <i md-icon>menu</i>
            </button>
            <span class="fill-remaining-space">Layers</span>
            <button md-button class="md-icon-button" aria-label="Settings"
                    (click)="layoutService.toggleLayerListVisibility()"
                    [ngSwitch]="layerListVisibility$ | async">
                <i *ngSwitchCase="true" md-icon>expand_less</i>
                <i *ngSwitchCase="false" md-icon>expand_more</i>
            </button>
        </md-toolbar-row>
    </md-toolbar>
    <wave-dialog-loader #loginDialog [type]="LoginDialogComponent"></wave-dialog-loader>
    `,
    styles: [`
    :host {
        display: block;
    }
    md-toolbar, md-toolbar >>> .md-toolbar-layout {
        height: 100%;
        padding: 0px;
    }
    md-toolbar >>> md-toolbar-row {
        height: 48px;
    }
    .title-bar {
        height: calc(100% - 96px);
        flex-direction: column;
    }
    h1 {
        opacity: 0.5;
        font-size: 34px;
    }
    md-divider {
        width: 100%;
    }
    .material-icons {
        vertical-align: middle;
    }
    .fill-remaining-space {
        flex: 1 1 auto;
        text-align: center;
    }
    button {
        color: ${Config.COLORS.TEXT.ACCENT};
    }
    button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MdToolbar, DialogLoaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoAreaComponent {
    layerListVisibility$: Observable<boolean>;
    username$: Observable<string>;

    LoginDialogComponent = LoginDialogComponent; // tslint:disable-line:variable-name

    constructor(
        private layoutService: LayoutService,
        private userService: UserService
    ) {
        this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();
        // this.username$ = this.userService.getUserStream().map(user =>  user.name);
        this.username$ = this.userService.getSessionStream().map(
            session =>  session.user === Config.USER.GUEST.NAME ? 'login' : session.user
        );
    }
}
