import {
    Component, AfterViewInit, Output, EventEmitter, ChangeDetectionStrategy,
    ChangeDetectorRef, AfterViewChecked, ViewChild,
} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MD_TABS_DIRECTIVES, MdTabGroup} from '@angular2-material/tabs';

import {MATERIAL_DIRECTIVES} from 'ng2-material';

import {StartTabComponent} from './start-tab.component';
import {OperatorsTabComponent} from './operators-tab.component';
import {ProjectTabComponent} from './project-tab.component';
import {DebugTabComponent} from './debug-tab.component';

import {LayoutService} from '../app/layout.service';

import Config from '../app/config.model';

/**
 * The ribbons component.
 */
@Component({
    selector: 'wave-ribbons-component',
    template: `
    <md-tab-group md-border-bottom (wheel)="onScroll($event)">
        <md-tab>
            <template md-tab-label>Start</template>
            <template md-tab-content>
                <wave-start-tab
                    (zoomIn)="zoomIn.emit()"
                    (zoomOut)="zoomOut.emit()"
                    (zoomLayer)="zoomLayer.emit()"
                    (zoomProject)="zoomProject.emit()"
                    (zoomMap)="zoomMap.emit()"
                    (addData)="addData.emit()"
                    (gfbio)="gfbio.emit()"
                    (csv)="csv.emit()"
                ></wave-start-tab>
            </template>
        </md-tab>
        <md-tab>
            <template md-tab-label>Operators</template>
            <template md-tab-content>
                <wave-operators-tab></wave-operators-tab>
            </template>
        </md-tab>
        <md-tab>
            <template md-tab-label>Project</template>
            <template md-tab-content>
                <wave-project-tab></wave-project-tab>
            </template>
        </md-tab>
        <md-tab *ngIf="DEVELOPER_MODE">
            <template md-tab-label>Debug</template>
            <template md-tab-content>
                <wave-debug-tab></wave-debug-tab>
            </template>
        </md-tab>
    </md-tab-group>
    `,
    styles: [`
    md-tab-group {
        height: 180px;
        min-height: 180px !important;
    }
    md-tab-group >>> .md-tab-header {
        height: 47px;
        border-bottom-width: 1px;
    }
    md-tab-group,
    md-tab-group >>> .md-tab-body-wrapper,
    md-tab-group >>> .md-tab-body {
        overflow: visible;
    }
    `],
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_TABS_DIRECTIVES,
        StartTabComponent, OperatorsTabComponent, ProjectTabComponent, DebugTabComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RibbonsComponent implements AfterViewInit, AfterViewChecked {

    @ViewChild(MdTabGroup) tabs: MdTabGroup;

    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    @Output() zoomLayer = new EventEmitter<void>();

    @Output() zoomProject = new EventEmitter<void>();

    @Output() zoomMap = new EventEmitter<void>();

    @Output() addData = new EventEmitter<void>();

    @Output() gfbio = new EventEmitter<void>();

    @Output() csv = new EventEmitter<void>();

    DEVELOPER_MODE: boolean = Config.DEVELOPER_MODE;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private layoutService: LayoutService
    ) {}

    ngAfterViewInit() {
        this.layoutService.getHeaderTabIndexStream().subscribe(tabIndex => {
            if (this.tabs.selectedIndex !== tabIndex) {
                this.tabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });

        // one time for material components
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    ngAfterViewChecked() {
        // Remove this hack when the tabs component has a proper API.

        // publish tab index if changed
        if (this.tabs.selectedIndex !== this.layoutService.getHeaderTabIndex()) {
            this.layoutService.setHeaderTabIndex(this.tabs.selectedIndex);
            setTimeout(() => this.changeDetectorRef.markForCheck());
        }
    }

    onScroll(event: WheelEvent) {
        const minTab = 0;
        const maxTab = (Config.DEVELOPER_MODE) ? 4 - 1 : 3 - 1; // this.tabs.labels.length - 1;

        const newTabIndex = Math.min(maxTab, Math.max(minTab, (
            this.layoutService.getHeaderTabIndex() + (event.deltaY > 0 ? 1 : -1)
        )));

        // this.tabs.selectedIndex = newTabIndex;
        this.layoutService.setHeaderTabIndex(newTabIndex);

        // fix for content to appear directly
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

}
