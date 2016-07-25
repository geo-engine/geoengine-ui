import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MD_CARD_DIRECTIVES} from '@angular2-material/card';

import {DefaultBasicDialog} from '../dialogs/basic-dialog.component';

@Component({
    selector: 'wave-help-dialog',
    template: `
    <md-card>
        <md-card-title>About</md-card-title>
        <md-card-subtitle>Contact Information</md-card-subtitle>
        <md-card-content>
            <ul>
                <li>Database Research Group of the University of Marburg</li>
                <li>Responsible: Prof. Dr. Bernhard Seeger</li>
                <li>
                    <a href="http://dbs.mathematik.uni-marburg.de">dbs.mathematik.uni-marburg.de</a>
                </li>
            </ul>
        </md-card-content>
    </md-card>
    <md-card>
        <md-card-title>User Account</md-card-title>
        <md-card-subtitle>Registration</md-card-subtitle>
        <md-card-content>
            <p>
                There is currently no online registration for VAT.
                If you would like to have an account, please send an E-Mail to
                <a href="mailto:mattig AT mathematik.uni-marburg.de">
                    mattig AT mathematik.uni-marburg.de
                </a>
            </p>
        </md-card-content>
    </md-card>
    `,
    styles: [`

    `],
    providers: [],
    directives: [
        CORE_DIRECTIVES, MD_CARD_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent extends DefaultBasicDialog implements OnInit {
    ngOnInit() {
        this.dialog.setTitle('Help');
    }
}
