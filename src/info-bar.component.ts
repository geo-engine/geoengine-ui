import {Component, Input, ChangeDetectionStrategy} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {BehaviorSubject} from "rxjs/Rx";

@Component({
    selector: 'info-bar-component',
    template: `
    <button md-button class="md-icon-button" aria-label="Settings"
            (click)="toggleTableOpen()" [ngSwitch]="dataTableVisible$ | async">
        <i *ngSwitchWhen="true" md-icon>expand_more</i>
        <i *ngSwitchWhen="false" md-icon>expand_less</i>
    </button>
    <small>
    Data Table
    <hr>
    Citation:
    {{citationString}}
    </small>
    `,
    styles: [`
    hr {
        transform:rotate(90deg);
        margin: 0px 10px;
        display: inline;
        border: 1px solid rgba(255, 255, 255, 0.87059);
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class InfoBarComponent {
    @Input()
    private citationString: string = 'none';

    @Input('dataTableVisible')
    private dataTableVisible$: BehaviorSubject<boolean>;

    private toggleTableOpen() {
        this.dataTableVisible$.next(!this.dataTableVisible$.getValue());
    }
}
