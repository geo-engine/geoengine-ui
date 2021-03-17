import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    HostBinding,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
    OnDestroy,
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {Config} from '../config.service';
import {TabContent, TabPanelService} from './tab-panel.service';

const TAB_BAR_HEIGHT_PX = 48 + 1;

@Component({
    selector: 'wave-tab-panel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabPanelComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.mat-elevation-z4') elevationStyle = true;

    @Input() maxHeight: number;
    @Output() heightChanges = new EventEmitter<number>();

    readonly collapsed: Observable<boolean>;
    readonly toggleTooltip: Observable<'Show' | 'Hide'>;
    readonly toggleTooltipDelay: number;

    readonly tabs: Observable<Array<TabContent>>;

    contentHeight = 0;

    protected collapsedSubscription: Subscription;

    constructor(protected readonly tabPanelService: TabPanelService, protected readonly config: Config) {
        this.collapsed = this.tabPanelService.collapsed;

        this.toggleTooltip = this.collapsed.pipe(map((isCollapsed) => (isCollapsed ? 'Show' : 'Hide')));
        this.toggleTooltipDelay = this.config.DELAYS.TOOLTIP;

        this.tabs = this.tabPanelService.tabs;
    }

    ngOnInit(): void {
        this.collapsedSubscription = this.collapsed.subscribe((collapsed) => this.setContentHeight(this.maxHeight, collapsed));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.maxHeight) {
            const maxHeight = changes.maxHeight.currentValue;
            this.collapsed.pipe(first()).subscribe((collapsed) => this.setContentHeight(maxHeight, collapsed));
        }
    }

    ngOnDestroy(): void {
        this.collapsedSubscription.unsubscribe();
    }

    toggleVisibility(): void {}

    setTabIndex(index: number): void {}

    protected setContentHeight(maxHeight: number, collapsed: boolean): void {
        let contentHeight = 0;
        if (!collapsed) {
            contentHeight = maxHeight - TAB_BAR_HEIGHT_PX;
        }

        const heightChanged = this.contentHeight !== contentHeight;

        this.contentHeight = contentHeight;

        if (heightChanged) {
            this.heightChanges.emit(contentHeight + TAB_BAR_HEIGHT_PX);
        }
    }
}
