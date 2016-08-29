import {COMMON_DIRECTIVES} from '@angular/common';
import {MD_CHECKBOX_DIRECTIVES} from '@angular2-material/checkbox';
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {UserService} from '../users/user.service';
import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';
import {VatLogoComponent} from './info-area.component';

@Component({
    selector: 'wave-introduction-dialog',
    template: `
        <wave-vat-logo></wave-vat-logo>
        <h1>Biodiversity data easily explored online</h1>
        <p>Visualize, analyse and transform your biodiversity data in a comfortable online GIS environment! Save and share your workflows!</p>
        <p>Have access to collections and biodiversity data centers, international data aggregators and environmental data, and integrate your own data!</p>
        <p>For a detailed introduction, please have a look at our help section!</p>
        <md-checkbox>Don’t show this message again</md-checkbox>
    `,
    styles: [`
    
    md-progress-circle {
        width: 100px;
        height: 100px;
    }
    `],
    providers: [],
    directives: [
        COMMON_DIRECTIVES, MD_CHECKBOX_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class IntroductionDialogComponent extends DefaultBasicDialog implements OnInit{

    constructor(private userService: UserService) {
        super();
    }

    ngOnInit() {
        this.dialog.setTitle('Visualization, analysis and transformation system');
    }

}