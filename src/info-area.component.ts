import {Component, Input, ChangeDetectionStrategy} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {BehaviorSubject} from "rxjs/Rx";

@Component({
    selector: "info-area-component",
    template: `
    <md-toolbar class="md-accent" layout="column">
        <div layout="row" layout-align="space-between center">
            <button md-button aria-label="User">
                <i md-icon>person</i>
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
                    (click)="toggleLayersVisible()" [ngSwitch]="layerListVisible$ | async">
                <i *ngSwitchWhen="true" md-icon>expand_less</i>
                <i *ngSwitchWhen="false" md-icon>expand_more</i>
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
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class InfoAreaComponent {
    @Input("layerListVisible")
    private layerListVisible$: BehaviorSubject<boolean>;

    toggleLayersVisible() {
        this.layerListVisible$.next(!this.layerListVisible$.getValue());
    }
}
