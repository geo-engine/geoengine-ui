import {Component, ChangeDetectionStrategy, Input} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {MATERIAL_DIRECTIVES} from "ng2-material/all";

/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: "wave-dialog-header",
    template: `
    <md-toolbar class="md-primary">
        <h2 class="md-toolbar-tools">
            <ng-content></ng-content>
        </h2>
    </md-toolbar>
    <div class="placeholder"></div>
    `,
    styles: [`
    md-toolbar {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
    }
    .placeholder {
        height: 48px;
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogHeaderComponent {}

@Component({
    selector: "wave-dialog-container",
    template: `
    <wave-dialog-header>{{title}}</wave-dialog-header>
    <md-content [style.maxHeight.px]="(windowHeight$ | async) - 48*4"
                [style.maxWidth.px]="(windowWidth$ | async) - 48*2">
        <ng-content></ng-content>
    </md-content>
    <ng-content select="[actions]"></ng-content>
    `,
    styles: [`
    md-content {
        margin-left: -24px;
        padding-left: 24px;
        margin-right: -24px;
        padding-right: 24px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    directives: [DialogHeaderComponent],
})
export class DialogContainerComponent {
    @Input() title: string;

    private windowHeight$: BehaviorSubject<number>;
    private windowWidth$: BehaviorSubject<number>;

    constructor() {
        this.windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, "resize")
                  .map(_ => window.innerHeight)
                  .subscribe(this.windowHeight$);

        this.windowWidth$ = new BehaviorSubject(window.innerWidth);
        Observable.fromEvent(window, "resize")
                  .map(_ => window.innerWidth)
                  .subscribe(this.windowWidth$);
    }
}
