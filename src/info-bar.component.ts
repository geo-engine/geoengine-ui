import {Component, Input, Output, EventEmitter,
        ChangeDetectionStrategy} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

@Component({
    selector: 'info-bar-component',
    template: `
    <button md-button class="md-icon-button" aria-label="Settings" (click)="switchTableOpen()">
        <i *ngIf="tableOpenState" md-icon>expand_more</i>
        <i *ngIf="!tableOpenState" md-icon>expand_less</i>
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
    
    private tableOpenState = true;
    
    @Output()
    private tableOpen: EventEmitter<boolean> = new EventEmitter();
    
    switchTableOpen() {
        this.tableOpenState = !this.tableOpenState;
        this.tableOpen.emit(this.tableOpenState);
    }
}
