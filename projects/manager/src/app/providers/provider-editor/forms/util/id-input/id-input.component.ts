import {Component, Input, OnInit} from '@angular/core';
import {v4 as uuidv4} from 'uuid';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'geoengine-manager-id-input',
    templateUrl: './id-input.component.html',
    styleUrl: './id-input.component.scss',
    imports: [ReactiveFormsModule, MatFormField, MatInput, MatButton, MatLabel],
})
export class IdInputComponent implements OnInit {
    @Input() id: FormControl<string> | undefined;

    ngOnInit(): void {
        if (!this.id?.value) {
            this.generate();
        }
    }

    generate(): void {
        this.id?.patchValue(uuidv4());
    }
}
