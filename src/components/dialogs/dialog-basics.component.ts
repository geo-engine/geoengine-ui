import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
        ChangeDetectorRef} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {MdToolbar} from '@angular2-material/toolbar';
import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MdDialog} from 'ng2-material';

/**
 * This component allows selecting an input operator by choosing a layer.
 */
@Component({
    selector: 'wave-dialog-header',
    template: `
    <md-toolbar class='md-primary'>
        <h2 class='md-toolbar-tools' layout='column'>
            <span flex='grow'>
                <ng-content></ng-content>
            </span>
            <button md-button class='md-icon-button' aria-label='Close Dialog'
                    (click)='close.emit()'>
                <i md-icon>close</i>
            </button>
        </h2>
    </md-toolbar>
    <div class='placeholder'></div>
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
    directives: [MATERIAL_DIRECTIVES, MdToolbar],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHeaderComponent {
    @Output() close = new EventEmitter<void>();

    constructor(private dialog: MdDialogRef) {
        this.close.subscribe(() => this.dialog.close());
    }
}

@Component({
    selector: 'wave-dialog-container',
    template: `
    <wave-dialog-header (close)='close.emit()'>{{title}}</wave-dialog-header>
    <md-content [style.maxHeight.px]='(windowHeight$ | async) - 48*4'
                [style.maxWidth.px]='(windowWidth$ | async) - 48*2'
                [class.no-overflow]='!overflow'>
        <ng-content></ng-content>
    </md-content>
    <ng-content select='[actions]'></ng-content>
    `,
    styles: [`
    md-content {
        margin-left: -24px;
        padding-left: 24px;
        margin-right: -24px;
        padding-right: 24px;
    }
    .no-overflow {
        overflow: hidden;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    directives: [DialogHeaderComponent],
})
export class DialogContainerComponent {
    @Input() title: string;
    @Input() overflow: boolean = true;

    @Output() close = new EventEmitter<void>();
    @Output() contentMaxSize = new EventEmitter<{ width: number; height: number; }>();

    private windowHeight$: BehaviorSubject<number>;
    private windowWidth$: BehaviorSubject<number>;

    maxWidth$: BehaviorSubject<number>;
    maxHeight$: BehaviorSubject<number>;

    constructor() {
        this.windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerHeight)
                  .subscribe(this.windowHeight$);

        this.windowWidth$ = new BehaviorSubject(window.innerWidth);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerWidth)
                  .subscribe(this.windowWidth$);

        const margin = 48;

        this.maxWidth$ = new BehaviorSubject(this.windowWidth$.getValue() - 2 * margin);
        this.windowWidth$.map(width => width - 2 * margin).subscribe(this.maxWidth$);

        this.maxHeight$ = new BehaviorSubject(this.windowHeight$.getValue() - 4 * margin);
        this.windowHeight$.map(height => height - 4 * margin).subscribe(this.maxHeight$);
    }
}
