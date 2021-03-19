import {CdkPortalOutlet, ComponentPortal} from '@angular/cdk/portal';
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    HostBinding,
    Input,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    ViewChild,
    ComponentFactoryResolver,
    Injector,
    AfterViewInit,
    ChangeDetectorRef,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {Config} from '../config.service';
import {LayoutService} from '../layout.service';
import {TabContent, TabPanelService} from './tab-panel.service';

@Component({
    selector: 'wave-tab-panel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabPanelComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @HostBinding('class.mat-elevation-z4') elevationStyle = true;
    @ViewChild(CdkPortalOutlet) portalOutlet: CdkPortalOutlet;

    @Input() maxHeight: number;
    @Input() visible: boolean;

    activeTab: TabContent;

    toggleTooltip: 'Show' | 'Hide';
    readonly toggleTooltipDelay: number;

    tabs: Array<TabContent> = [];

    contentHeight = 0;

    protected tabSubscription: Subscription;

    constructor(
        protected readonly tabPanelService: TabPanelService,
        protected readonly layoutService: LayoutService,
        protected readonly config: Config,
        protected readonly componentFactoryResolver: ComponentFactoryResolver,
        protected readonly injector: Injector,
        protected readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.toggleTooltipDelay = this.config.DELAYS.TOOLTIP;

        this.tabSubscription = this.tabPanelService.tabs.subscribe((tabs) => {
            const wasRemoval = this.tabs.length > tabs.length;
            const wasAddition = this.tabs.length < tabs.length;

            this.tabs = tabs;

            if (wasRemoval) {
                this.checkForDeselection();
            }

            if (wasAddition) {
                this.setTab(this.tabs[this.tabs.length - 1]);
            }

            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.maxHeight || changes.visible) {
            this.setContentHeight(this.maxHeight, this.visible);
        }

        if (changes.visible) {
            this.toggleTooltip = this.visible ? 'Hide' : 'Show';

            if (this.visible && this.activeTab) {
                this.renderTabContent(this.activeTab);
            } else if (!this.visible) {
                this.removeRenderedTabContent();
            }
        }
    }

    ngOnDestroy(): void {
        this.tabSubscription.unsubscribe();
    }

    toggleVisibility(): void {
        this.layoutService.toggleLayerDetailViewVisibility();
    }

    setTab(tabContent: TabContent): void {
        if (tabContent === this.activeTab) {
            return; // already selected
        }

        this.activeTab = tabContent;
        this.layoutService.setLayerDetailViewVisibility(true);

        this.renderTabContent(tabContent);

        this.changeDetectorRef.markForCheck();
    }

    closeTab(tabContent: TabContent): void {
        this.tabPanelService.removeComponent(this.tabs.indexOf(tabContent));
    }

    protected renderTabContent(tabContent: TabContent): void {
        this.removeRenderedTabContent();

        const portal = new ComponentPortal(tabContent.component);
        const componentRef = this.portalOutlet.attach(portal);

        const component = componentRef.instance;

        // inject data
        for (const property of Object.keys(tabContent.inputs)) {
            component[property] = tabContent.inputs[property];
        }
    }

    protected removeRenderedTabContent(): void {
        if (this.portalOutlet && this.portalOutlet.hasAttached()) {
            this.portalOutlet.detach();
        }
    }

    protected checkForDeselection(): void {
        if (this.tabs.indexOf(this.activeTab) === -1) {
            this.removeRenderedTabContent();
            this.activeTab = undefined;
        }
    }

    protected setContentHeight(maxHeight: number, visible: boolean): void {
        let contentHeight = 0;
        if (visible) {
            contentHeight = maxHeight - LayoutService.getLayerDetailViewBarHeightPx();
        }

        this.contentHeight = contentHeight;
    }
}
