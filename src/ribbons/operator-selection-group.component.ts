import {
    Component, Input, ChangeDetectionStrategy, ContentChildren, QueryList, Output, EventEmitter,
    ChangeDetectorRef,
} from 'angular2/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

const SIZES = {
    BUTTON: {
        SMALL: {
            WIDTH: 50,
        },
        LARGE: {
            WIDTH: 100,
        },
    },
    FIELDSET: {
        HEIGHT: 125,
        MARGIN: 2,
        BORDER: 1,
        PADDING: 0,
        LEGEND: {
            HEIGHT: 18,
        },
    },
    SELECTOR: {
        WIDTH: 24,
        HEIGHT: 24,
    },
};

@Component({
    selector: 'wave-operator-button',
    template: `
    <button md-button class="md-primary" layout="column" layout-align="center center"
            [class.small]="small" [class.large]="!small"
            (click)="click.emit();$event.stopPropagation()">
        <img [src]="iconUrl" [alt]="text">
        <div>{{text}}</div>
    </button>
    `,
    styles: [`
    button.large {
        width: ${SIZES.BUTTON.LARGE.WIDTH}px;
        height: ${SIZES.FIELDSET.HEIGHT - SIZES.FIELDSET.LEGEND.HEIGHT}px;
        padding: 0px;
        margin: 0px;
    }
    button.large img {
        vertical-align: middle;
        width: 36px;
        height: 36px;
    }
    button.large div {
        white-space: normal;
        line-height: 14px;
    }
    button.small {
        width: ${SIZES.BUTTON.SMALL.WIDTH}px;
        min-width: ${SIZES.BUTTON.SMALL.WIDTH}px;
        height: ${SIZES.FIELDSET.HEIGHT - SIZES.FIELDSET.LEGEND.HEIGHT}px;
        padding: 0px;
        margin: 0px;
    }
    button.small >>> span {
        line-height: ${SIZES.FIELDSET.HEIGHT - SIZES.FIELDSET.LEGEND.HEIGHT}px;
    }
    button.small img {
        vertical-align: middle;
        width: 48px;
        height: 48px;
    }
    button.small div {
        display: none;
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorButtonComponent {
    @Input() text: string;
    @Input() iconUrl: string;
    @Input() small = false;

    @Output() click = new EventEmitter<void>();
}

@Component({
    selector: 'wave-operator-selection-group',
    template: `
    <fieldset>
        <legend>{{groupName}}</legend>
        <div layout="row" [style.width.px]="getGroupWidth()">
            <div layout="row">
                <ng-content selector="wave-operator-button"></ng-content>
            </div>
            <div class="selector" [hidden]="buttonsVisible >= buttons.length"
                 [ngSwitch]="expanded" (click)="toggleExpand()">
                <i md-icon *ngSwitchWhen="true">expand_less</i>
                <i md-icon *ngSwitchWhen="false">expand_more</i>
            </div>
        </div>
    </fieldset>
    `,
    styles: [`
    fieldset {
        height: ${SIZES.FIELDSET.HEIGHT}px;
        border-style: solid;
        margin: ${SIZES.FIELDSET.MARGIN}px;
        border-width: ${SIZES.FIELDSET.BORDER}px;
        padding: ${SIZES.FIELDSET.PADDING}px;
    }
    fieldset legend {
        height: ${SIZES.FIELDSET.LEGEND.HEIGHT}px;
    }
    .selector {
        width: ${SIZES.SELECTOR.WIDTH}px;
        line-height: ${SIZES.FIELDSET.HEIGHT - SIZES.SELECTOR.HEIGHT / 2}px;
        height: ${SIZES.FIELDSET.HEIGHT - SIZES.FIELDSET.LEGEND.HEIGHT}px;
        cursor: pointer;
    }
    .selector:hover {
        background-color: rgba(158, 158, 158, 0.2);
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorSelectionGroupComponent {
    @ContentChildren(OperatorButtonComponent) buttons: QueryList<OperatorButtonComponent>;

    @Input() groupName: string;

    @Input() smallButtons = false;

    expanded = false;
    private _buttonsVisible = 1;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    @Input()
    set buttonsVisible(amount: number) {
        this._buttonsVisible = amount;
        this.changeDetectorRef.markForCheck();
    }

    get buttonsVisible() {
        return this._buttonsVisible;
    }

    getGroupWidth(): number {
        const selectorWidth = this.buttonsVisible < this.buttons.length ? SIZES.SELECTOR.WIDTH : 0;

        if (this.smallButtons) {
            return SIZES.BUTTON.SMALL.WIDTH * this.buttonsVisible + selectorWidth;
        } else {
            return SIZES.BUTTON.LARGE.WIDTH * this.buttonsVisible + selectorWidth;
        }
    }

    toggleExpand() {
        this.expanded = !this.expanded;
    }

    maxWidth(): number {
        return SIZES.BUTTON.LARGE.WIDTH * this.buttons.length;
    }

}
