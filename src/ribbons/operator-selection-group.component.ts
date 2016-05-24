import {
    Component, Input, ChangeDetectionStrategy, ContentChildren, QueryList, Output, EventEmitter,
    ChangeDetectorRef, AfterViewInit,
} from '@angular/core';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

/**
 * Sizes for the buttons and the groups to use within calculations and style settings.
 */
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

/**
 * An operator button.
 */
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

    /**
     * Propagates the click event of the button.
     */
    @Output() click = new EventEmitter<void>();
}

/**
 * A group of operator buttons with enlargement option.
 */
@Component({
    selector: 'wave-operator-selection-group',
    template: `
    <div class="container" [class.expanded]="expanded"
         [style.height.px]="getGroupHeight() + ${SIZES.FIELDSET.LEGEND.HEIGHT}">
        <fieldset [style.height.px]="getGroupHeight() + ${SIZES.FIELDSET.LEGEND.HEIGHT}">
            <legend>{{groupName}}</legend>
            <div layout="row" [style.width.px]="getGroupInnerWidth()">
                <div class="buttons" layout="row" layout-wrap
                     [style.width.px]="getButtonsWidth()" [style.height.px]="getGroupHeight()">
                    <ng-content selector="wave-operator-button"></ng-content>
                </div>
                <div class="selector"
                     [hidden]="buttonsVisible >= buttons.length"
                     [ngSwitch]="expanded" (click)="toggleExpand()">
                    <i md-icon *ngSwitchWhen="true">expand_less</i>
                    <i md-icon *ngSwitchWhen="false">expand_more</i>
                </div>
            </div>
        </fieldset>
    </div>
    <md-backdrop class="overlay md-backdrop md-opaque md-active" [hidden]="!expanded"
                 (click)="toggleExpand()"></md-backdrop>
    `,
    styles: [`
    .container {
        position: relative;
        z-index: 1;
        background-color: #fff;
        margin: ${SIZES.FIELDSET.MARGIN}px;
    }
    .container.expanded {
        z-index: 6;
    }
    fieldset {
        border-style: solid;
        border-width: ${SIZES.FIELDSET.BORDER}px;
        padding: ${SIZES.FIELDSET.PADDING}px;
        margin: 0px;
    }
    fieldset legend {
        height: ${SIZES.FIELDSET.LEGEND.HEIGHT}px;
    }
    .buttons {
        overflow: hidden;
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
    .overlay {
        z-index: 5;
        opacity: .24 !important;
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorSelectionGroupComponent implements AfterViewInit {
    @ContentChildren(OperatorButtonComponent) buttons: QueryList<OperatorButtonComponent>;

    @Input() groupName: string;

    @Input() _smallButtons = false;

    expanded = false;
    private _buttonsVisible = 1;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    ngAfterViewInit() {
        this.buttons.forEach(button => {
            button.click.subscribe(() => {
                this.expanded = false;
                this.changeDetectorRef.markForCheck();
            });
        });
    }

    @Input()
    set smallButtons(small: boolean) {
        this._smallButtons = small;
        this.changeDetectorRef.markForCheck();
    }

    get smallButtons(): boolean {
        return this._smallButtons;
    }

    @Input()
    set buttonsVisible(amount: number) {
        this._buttonsVisible = Math.min(amount, this.buttons.length);
        this.changeDetectorRef.markForCheck();
    }

    get buttonsVisible(): number {
        return this._buttonsVisible;
    }

    /**
     * @returns the total width of the buttons.
     */
    getButtonsWidth(numberOfButtonsVisible: number = this.buttonsVisible): number {
        if (this.smallButtons) {
            return SIZES.BUTTON.SMALL.WIDTH * numberOfButtonsVisible;
        } else {
            return SIZES.BUTTON.LARGE.WIDTH * numberOfButtonsVisible;
        }
    }

    /**
     * @returns the total width of the button group without outside margins.
     */
    getGroupInnerWidth(numberOfButtonsVisible: number = this.buttonsVisible): number {
        numberOfButtonsVisible = Math.min(numberOfButtonsVisible, this.buttons.length);

        const selectorWidth =
            numberOfButtonsVisible < this.buttons.length ? SIZES.SELECTOR.WIDTH : 0;

        return this.getButtonsWidth(numberOfButtonsVisible) + selectorWidth;
    }

    /**
     * @returns the total width of the button group including outside margins.
     */
    getGroupWidth(numberOfButtonsVisible: number = this.buttonsVisible): number {
        const margins =
            2 * (SIZES.FIELDSET.PADDING + SIZES.FIELDSET.BORDER + SIZES.FIELDSET.MARGIN);

        return this.getGroupInnerWidth(numberOfButtonsVisible) + margins;
    }

    /*
     * @returns the tota height of the button group depending on the expansion state.
     */
    getGroupHeight(): number {
        const buttonHeight = SIZES.FIELDSET.HEIGHT - SIZES.FIELDSET.LEGEND.HEIGHT;
        const rows = Math.ceil(this.buttons.length / this._buttonsVisible);

        if (this.expanded) {
            return buttonHeight * rows;
        } else {
            return buttonHeight;
        }
    }

    /**
     * Toggle the expansion state.
     */
    toggleExpand() {
        this.expanded = !this.expanded;
    }

    /*
     * @returns the maximum width this component could take.
     */
    maxWidth(): number {
        return SIZES.BUTTON.LARGE.WIDTH * this.buttons.length
                + 2 * (SIZES.FIELDSET.PADDING + SIZES.FIELDSET.BORDER + SIZES.FIELDSET.MARGIN);
    }

}
