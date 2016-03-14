import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
@Component({
    selector: 'info-area-component',
    template: `
    <md-toolbar class="md-accent" layout="column">
        <div layout="row" layout-align="space-between center">
            <button md-button aria-label="User">
                <i class="green" md-icon>person</i>
                Username
            </button>
            <button md-button class="md-icon-button" aria-label="Help">
                <i md-icon>help</i>
            </button>
        </div>
        <md-divider></md-divider>
        <h1 flex="grow" layout="row" layout-align="center center">WAVE</h1>
        <md-divider></md-divider>
        <div layout="row" layout-align="space-between center">
            <button md-button class="md-icon-button" aria-label="Settings">
                <i md-icon>menu</i>
            </button>
            Layers
            <button md-button class="md-icon-button" aria-label="Settings"
                    (click)="toggleLayersVisible()">
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
        h1 {
            opacity: 0.5;
            font-size: 34px;
        }
        .material-icons {
            vertical-align: middle;
        }
    `],
    directives: [MATERIAL_DIRECTIVES]
})

export class InfoAreaComponent {
    @Output('layerListVisible')
    private layerListVisibleEmitter = new EventEmitter<boolean>();
    
    private layerListVisible = true;
    
    toggleLayersVisible() {
        this.layerListVisible = !this.layerListVisible;
        
        this.layerListVisibleEmitter.emit(this.layerListVisible);
    }
}
