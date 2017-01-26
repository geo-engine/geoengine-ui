import {Component, ChangeDetectionStrategy, AfterViewInit, ViewChild, AfterContentInit} from '@angular/core';
import {MdDialog} from "@angular/material";
import {Observable} from 'rxjs/Rx';

import Config from '../app/config.model';

// import {DialogLoaderComponent} from '../dialogs/dialog-loader.component';
import {LoginDialogComponent} from '../users/login-dialog.component';
import {HelpDialogComponent} from '../app/help.component';
import {IntroductionDialogComponent} from './introduction-dialog.component';

import {UserService} from '../users/user.service';
import {LayoutService} from '../app/layout.service';

/**
 * The top left info area component for user info and layer list collapsing.
 */
@Component({
    selector: 'wave-info-area',
    template: `
    <md-toolbar class="md-accent">
        <button md-button aria-label="User" (click)="openUserDialog()">
            <md-icon>person</md-icon>
            {{username$ | async}}
        </button>
        <span class="fill-remaining-space"></span>
        <button md-icon-button class="md-icon-button" aria-label="Help" (click)="helpDialog.show()">
            <md-icon>help</md-icon>
        </button>
        <md-toolbar-row class="title-bar">
            <md-divider></md-divider>
            <wave-vat-logo *ngIf="${Config.PROJECT === 'GFBio'}"></wave-vat-logo>
            <wave-idessa-logo *ngIf="${Config.PROJECT === 'IDESSA'}"></wave-idessa-logo>
            <md-divider></md-divider>
        </md-toolbar-row>
        <md-toolbar-row>
            <button
                md-button class="md-icon-button" aria-label="Layer List Actions"
                disabled="true" style="visibility: hidden;"
            >
                <md-icon>menu</md-icon>
            </button>
            <span class="fill-remaining-space">Layers</span>
            <button md-icon-button aria-label="Toggle Layer List Visibility"
                    (click)="layoutService.toggleLayerListVisibility()"
                    [ngSwitch]="layerListVisibility$ | async">
                <md-icon *ngSwitchCase="true">expand_less</md-icon>
                <md-icon *ngSwitchCase="false">expand_more</md-icon>
            </button>
        </md-toolbar-row>
    </md-toolbar>
    <!--<wave-dialog-loader #helpDialog [type]="HelpDialogComponent"></wave-dialog-loader>-->
    <!--<wave-dialog-loader #introductionDialog [type]="IntroductionDialogComponent"></wave-dialog-loader>-->
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
    ${Config.PROJECT === 'IDESSA' ? `
        md-toolbar {
            background: white !important;
            color: black !important;
        }
        md-toolbar >>> button {
            color: black !important;
        }
    ` : ''}
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoAreaComponent implements AfterContentInit {

    // @ViewChild('introductionDialog') introductionDialogLoader: DialogLoaderComponent;
    layerListVisibility$: Observable<boolean>;
    username$: Observable<string>;

    // tslint:disable:variable-name
    IntroductionDialogComponent = IntroductionDialogComponent;
    HelpDialogComponent = HelpDialogComponent;
    // tslint:enable

    constructor(
        public dialog: MdDialog,
        private layoutService: LayoutService,
        private userService: UserService
    ) {
        this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();
        // this.username$ = this.userService.getUserStream().map(user =>  user.name);
        this.username$ = this.userService.getSessionStream().map(
            session =>  session.user === Config.USER.GUEST.NAME ? 'login' : session.user
        );
    }

    openUserDialog() {
      let dialogRef = this.dialog.open(LoginDialogComponent, {
        disableClose: false
      });
    }

    ngAfterContentInit() {
      if (this.userService.shouldShowIntroductoryPopup()) {
        setTimeout(() => {
          this.dialog.open(IntroductionDialogComponent, {});
        });
      }
    }
}
