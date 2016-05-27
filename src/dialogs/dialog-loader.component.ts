import {
    Component, ChangeDetectionStrategy, ViewChild, ComponentFactory,
    ComponentRef, Input, ViewContainerRef, ComponentResolver,
} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MdDialog} from 'ng2-material';
import {MdToolbar} from '@angular2-material/toolbar';

import {DialogRef} from './dialog-ref.model';
import {BasicDialog, ButtonDescription} from './basic-dialog.component';

@Component({
    selector: 'wave-dialog-loader',
    template: `
    <md-dialog>
        <md-toolbar>
            <span>{{title}}</span>
            <button md-button class="md-icon-button" aria-label="Close Dialog" (click)="close()">
                <i md-icon>close</i>
            </button>
        </md-toolbar>
        <md-content
            [style.maxHeight.px]="maxHeight$ | async"
            [style.maxWidth.px]="maxWidth$ | async"
            [class.no-overflow]="!overflow"
        >
            <template #target></template>
        </md-content>
        <md-dialog-actions *ngIf="buttons.length > 0">
            <button md-button type="button"
                *ngFor="let buttonProperties of buttons"
                [class]="buttonProperties.class"
                (click)="buttonProperties.action()"
                [attr.aria-label]="buttonProperties.title"
            >{{buttonProperties.title}}</button>
        </md-dialog-actions>
    </md-dialog>
    `,
    styles: [`
    md-toolbar,
    md-toolbar >>> .md-toolbar-layout,
    md-toolbar >>> md-toolbar-row{
        height: 48px;
        min-height: 48px;
    }
    md-toolbar {
        margin-top: -24px;
        margin-left: -24px;
        margin-right: -24px;
        width: calc(100% + 2*24px);
    }
    span {
        flex: 1 1 auto;
    }
    md-content {
        margin-left: -24px;
        padding-left: 24px;
        margin-right: -24px;
        padding-right: 24px;
    }
    md-content.no-overflow {
        overflow: hidden;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MdDialog, MdToolbar],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class DialogLoaderComponent {
    @ViewChild(MdDialog) dialog: MdDialog;

    @ViewChild('target', {read: ViewContainerRef}) target: ViewContainerRef;
    @Input() type: BasicDialog;

    dialogChild: ComponentRef<BasicDialog>;

    dialogIsOpen: boolean = false;

    // These properties get extracted from the child component.
    overflow: boolean = true;
    title: string = '';
    buttons: Array<ButtonDescription> = [];

    private dialogRef: DialogRef;

    private maxHeight$: Observable<number>;
    private maxWidth$: Observable<number>;

    private windowHeight$: BehaviorSubject<number>;
    private windowWidth$: BehaviorSubject<number>;

    constructor(
        private componentResolver: ComponentResolver
    ) {
        this.windowHeight$ = new BehaviorSubject(window.innerHeight);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerHeight)
                  .subscribe(this.windowHeight$);

        this.windowWidth$ = new BehaviorSubject(window.innerWidth);
        Observable.fromEvent(window, 'resize')
                  .map(_ => window.innerWidth)
                  .subscribe(this.windowWidth$);

        const MARGIN = 48;

        this.maxHeight$ = this.windowHeight$.map(height => height - 4 * MARGIN);
        this.maxWidth$ = this.windowWidth$.map(width => width - 2 * MARGIN);

        this.dialogRef = {
            maxHeight$: this.maxHeight$,
            maxWidth$: this.maxWidth$,
            maxHeight: undefined,
            maxWidth: undefined,
            close: () => this.close(),
        };

        this.maxHeight$.subscribe(maxHeight => this.dialogRef.maxHeight = maxHeight);
        this.maxWidth$.subscribe(maxWidth => this.dialogRef.maxWidth = maxWidth);
    }

    show() {
        if (this.type) {
            if (this.dialogChild) {
                this.dialogChild.destroy();
            }

            this.componentResolver.resolveComponent(
                this.type
            ).then((factory: ComponentFactory<BasicDialog>) => {
                this.dialogChild = this.target.createComponent(factory);

                // extract
                this.title = this.dialogChild.instance.title;
                this.buttons = this.dialogChild.instance.buttons;

                // inject
                this.dialogChild.instance.dialog = this.dialogRef;

                this.dialogIsOpen = true;
                this.dialog.show();
            });
        }
    }

    close() {
        this.dialogIsOpen = false;
        this.dialog.close();

        if (this.dialogChild) {
            this.dialogChild.destroy();
        }
    }
}
