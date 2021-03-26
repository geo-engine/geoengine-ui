import {ComponentType} from '@angular/cdk/portal';
import {Injectable} from '@angular/core';
import {BehaviorSubject, NEVER, Observable, of, Subscription} from 'rxjs';

/**
 * A component to display inside a tab
 */
export interface TabContent {
    component: ComponentType<any>;
    name: Observable<string>;
    inputs: TabInputs;
    /**
     * It checks wether `TabContent`s are equal.
     * Before that, it checks that the components are equal.
     */
    equals: (a: TabInputs, b: TabInputs) => boolean;
    removeTrigger: Observable<void>;
    removeTriggerSubscription: Subscription;
}

export interface TabInputs {
    [property: string]: any;
}

@Injectable({
    providedIn: 'root',
})
export class TabsService {
    protected readonly _tabs = new BehaviorSubject<Array<TabContent>>([]);

    protected readonly _activeTab = new BehaviorSubject(undefined);

    constructor() {}

    get tabs(): Observable<Array<TabContent>> {
        return this._tabs;
    }

    /**
     * Add a new component to the tab panel
     */
    addComponent<T>(config: {
        readonly name: string | Observable<string>;
        readonly component: ComponentType<T>;
        readonly inputs?: TabInputs;
        readonly equals?: (a: TabInputs, b: TabInputs) => boolean;
        readonly removeTrigger?: Observable<void>;
    }): void {
        const name = this.observableName(config.name);
        const component = config.component;
        const inputs = config.inputs ?? {};
        const equals = config.equals ?? ((a, b): boolean => a === b);
        const removeTrigger = config.removeTrigger ?? NEVER;

        const duplicateIndex = this._tabs.getValue().findIndex((other) => other.component === component && equals(other.inputs, inputs));

        if (duplicateIndex >= 0) {
            this.activeTab = this._tabs.getValue()[duplicateIndex];

            return;
        }

        const tab: TabContent = {name, component, inputs, equals, removeTrigger, removeTriggerSubscription: Subscription.EMPTY};
        tab.removeTriggerSubscription = removeTrigger.subscribe(() => this.removeComponent(tab));

        const tabs = [...this._tabs.getValue(), tab];
        this._tabs.next(tabs);

        this.activeTab = tab;
    }

    /**
     * Remove the component at index `index` from the tab panel
     */
    removeComponent(tabContent: TabContent): void {
        const oldTabs = this._tabs.getValue();
        const index = oldTabs.indexOf(tabContent);

        if (index < 0) {
            return;
        }

        const tabs = [...oldTabs.slice(0, index), ...oldTabs.slice(index + 1, oldTabs.length)];
        this._tabs.next(tabs);

        if (this.activeTab === tabContent) {
            // select the tab right next to it, or otherwise the last tab
            const indexToSelect = Math.min(index, tabs.length - 1);

            // if index is -1, it defaults to undefined
            this.activeTab = tabs[indexToSelect];
        }

        tabContent.removeTriggerSubscription.unsubscribe();
    }

    get activeTab(): TabContent {
        return this._activeTab.getValue();
    }

    set activeTab(tabContent: TabContent) {
        if (this.activeTab === tabContent) {
            return;
        }

        this._activeTab.next(tabContent);
    }

    getActiveTabChanges(): Observable<TabContent> {
        return this._activeTab;
    }

    protected observableName(name: string | Observable<string>): Observable<string> {
        if (typeof name === 'string') {
            return of(name);
        }

        return name;
    }
}
