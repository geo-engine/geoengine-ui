import {
    Component, AfterViewInit, Output, EventEmitter, ChangeDetectionStrategy,
    ChangeDetectorRef, AfterViewChecked, ViewChild,
} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {MATERIAL_DIRECTIVES, MdTabs} from 'ng2-material';

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
    <md-tabs md-border-bottom (wheel)="onScroll($event)">
        <template md-tab label="Start">
            <wave-start-tab
                (zoomIn)="zoomIn.emit()"
                (zoomOut)="zoomOut.emit()"
                (zoomLayer)="zoomLayer.emit()"
                (zoomProject)="zoomProject.emit()"
                (zoomMap)="zoomMap.emit()"
                (addData)="addData.emit()"
            ></wave-start-tab>
        </template>
        <template md-tab label="Operators">
            <wave-operators-tab></wave-operators-tab>
        </template>
        <template md-tab label="Project">
            <wave-project-tab></wave-project-tab>
        </template>
        <template *ngIf="DEVELOPER_MODE" md-tab label="Debug">
            <wave-debug-tab></wave-debug-tab>
        </template>
    </md-tabs>
    `,
    styles: [`
    md-tabs {
        height: 180px;
        overflow: visible;
    }
    md-tabs >>> md-tabs-content-wrapper, md-tabs >>> md-tab-content {
        overflow: visible;
    }
    `],
    directives: [
        CORE_DIRECTIVES, MATERIAL_DIRECTIVES,
        StartTabComponent, OperatorsTabComponent, ProjectTabComponent, DebugTabComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RibbonsComponent implements AfterViewInit, AfterViewChecked {

    @ViewChild(MdTabs) tabs: MdTabs;

    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    @Output() zoomLayer = new EventEmitter<void>();

    @Output() zoomProject = new EventEmitter<void>();

    @Output() zoomMap = new EventEmitter<void>();

    @Output() addData = new EventEmitter<void>();

    DEVELOPER_MODE: boolean = Config.DEVELOPER_MODE;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private layoutService: LayoutService
    ) {}

    ngAfterViewInit() {
        this.tabs.selected = this.layoutService.getHeaderTabIndex();
        // do this one time for ngMaterial
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        }, 0);
    }

    ngAfterViewChecked() {
        // Remove this hack when the tabs component has a proper API.

        // publish tab index if changed
        this.layoutService.setHeaderTabIndex(this.tabs.selected);
    }

    onScroll(event: WheelEvent) {
        const minTab = 0;
        const maxTab = this.tabs.panes.length - 1;

        const newTabIndex = Math.min(maxTab, Math.max(minTab, (
            this.layoutService.getHeaderTabIndex() + (event.deltaY > 0 ? 1 : -1)
        )));

        this.tabs.selected = newTabIndex;
        this.layoutService.setHeaderTabIndex(newTabIndex);
    }

}
