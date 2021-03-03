import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

/** @title Feedback component */
@Component({
    selector: 'wave-help-feedback',
    templateUrl: 'help-feedback.component.html',
    styleUrls: ['help-feedback.component.scss'],
})
export class HelpFeedbackComponent implements OnInit {
    form: FormGroup;

    constructor(private formBuilder: FormBuilder) {}

    ngOnInit() {
        this.form = this.formBuilder.group({
            requestType: ['Feedback', Validators.required],
            name: ['', [Validators.required, Validators.minLength(1)]],
            email: ['', [Validators.required, Validators.email]],
            topic: ['', [Validators.required, Validators.minLength(1)]],
            text: ['', [Validators.required, Validators.minLength(1)]],
        });

        setTimeout(() => this.form.updateValueAndValidity({emitEvent: true}));
    }

    send() {
        const mailTo = 'vat@mathematik.uni-marburg.de';
        const subject = `[${this.form.controls['requestType'].value}] ${this.form.controls['topic'].value}`;
        const message = `
            Reply To: ${this.form.controls['email'].value}
            \n\n
            ~~~~~~~~~~
            \n\n
            ${this.form.controls['text'].value}
        `.trim();

        // TODO: replace with web service call
        window.location.href = `mailto:${mailTo}?subject=${subject}&body=${message}`;
    }
}
