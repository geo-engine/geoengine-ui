import {Component, OnInit, ChangeDetectionStrategy, HostBinding, Input, OnChanges, SimpleChanges, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs';
import {Config} from '../config.service';
import {LayoutService} from '../layout.service';
import {TabContent, TabPanelService} from './tab-panel.service';

@Component({
    selector: 'wave-tab-panel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabPanelComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.mat-elevation-z4') elevationStyle = true;

    @Input() maxHeight: number;
    @Input() visible: boolean;

    toggleTooltip: 'Show' | 'Hide';
    readonly toggleTooltipDelay: number;

    readonly tabs: Observable<Array<TabContent>>;

    contentHeight = 0;

    constructor(
        protected readonly tabPanelService: TabPanelService,
        protected readonly layoutService: LayoutService,
        protected readonly config: Config,
    ) {
        this.toggleTooltipDelay = this.config.DELAYS.TOOLTIP;

        this.tabs = this.tabPanelService.tabs;
    }

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.maxHeight || changes.visible) {
            this.setContentHeight(this.maxHeight, this.visible);
        }

        if (changes.visible) {
            this.toggleTooltip = this.visible ? 'Hide' : 'Show';
        }
    }

    ngOnDestroy(): void {}

    toggleVisibility(): void {
        this.layoutService.toggleLayerDetailViewVisibility();
    }

    setTabIndex(_index: number): void {
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    closeTab(index: number): void {
        this.tabPanelService.removeComponent(index);
    }

    protected setContentHeight(maxHeight: number, visible: boolean): void {
        let contentHeight = 0;
        if (visible) {
            contentHeight = maxHeight - LayoutService.getLayerDetailViewBarHeightPx();
        }

        this.contentHeight = contentHeight;
    }
}
