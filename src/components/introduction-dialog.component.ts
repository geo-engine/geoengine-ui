import {ChangeDetectionStrategy, Component, OnInit, AfterContentInit} from '@angular/core';
import {UserService} from '../users/user.service';
import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';
import {VatLogoComponent, GFBioLogoComponent} from '../app/logo.component';
import {MdCheckboxChange, MdDialogRef} from "@angular/material";
import {LoginDialogComponent} from "../users/login-dialog.component";

@Component({
    selector: 'wave-introduction-dialog',
    template: `
        <h1 md-dialog-title> Visualization, analysis and transformation system</h1>
        <div md-dialog-content>
          <h2>Biodiversity data easily explored online</h2>
          <p>
              Visualize, analyse and transform your biodiversity data in a comfortable online GIS environment! 
              Save and share your workflows!
          </p>
          <p>
              Have access to collections and biodiversity data centers, international data aggregators and environmental
               data, and integrate your own data!
          </p>
          <p>For a detailed introduction, please have a look at our help section!</p>
          <md-checkbox [ngModel]="isChecked" (change)="changeTick($event)">Don’t show this message again</md-checkbox>
        </div>
    `,
    styles: [`
    h1,
    h2 {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      font-family: Roboto, "Helvetica Neue";
    }
    [md-dialog-content] {
      font-family: Roboto, "Helvetica Neue";
    }
    md-progress-circle {
        width: 100px;
        height: 100px;
    }
    `],
})
export class IntroductionDialogComponent implements AfterContentInit {

    isChecked: boolean;

    constructor(
      public dialogRef: MdDialogRef<IntroductionDialogComponent>,
      private userService: UserService
    ) {

    }

    ngAfterContentInit() {
      //this.isChecked = !this.userService.shouldShowIntroductoryPopup();
    }

    changeTick(event: MdCheckboxChange) {
        this.userService.setIntroductoryPopup(!event.checked);
    }

}
