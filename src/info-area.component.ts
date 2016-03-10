import {Component, Input} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
@Component({
    selector: 'info-area-component',
    template: `
    <md-toolbar class="md-accent">
        <div>
            VAT
            <button md-button class="md-icon-button" aria-label="Person" (click)="clicked('Person')">
                <i class="green" md-icon>person</i>
            </button>
            <button md-button class="md-icon-button" aria-label="Help" (click)="clicked('Help')">
                <i md-icon>help</i>
            </button>
        </div>
        <div class="md-toolbar-tools">
            <button md-button class="md-icon-button" aria-label="Settings" (click)="clicked('Menu')">
                <i md-icon>menu</i>
            </button>
            Layers
            <button md-button class="md-icon-button" aria-label="Settings" (click)="layersClicked()">
                <i *ngIf="!layerListVisible" md-icon>expand_more</i>
                <i *ngIf="layerListVisible" md-icon>expand_less</i>
            </button>
        </div>
    </md-toolbar>
    `,
    styles: [`
        md-toolbar {
            height: 100%;
        }
    `],
    directives: [MATERIAL_DIRECTIVES]
})

export class InfoAreaComponent {
    @Input()
    private disabled: boolean;
}
