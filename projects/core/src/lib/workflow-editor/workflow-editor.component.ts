import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {map} from 'rxjs/operators';
import {Component, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Layer} from '@geoengine/common';
import {TypedOperatorOperator} from '@geoengine/openapi-client';
import {ProjectService} from "../project/project.service";
import {LayoutService} from "../layout.service";
import {render, WidgetModel} from "workflow-editor";
import {UserService} from "../users/user.service";

@Component({
    selector: 'geoengine-workflow-editor',
    templateUrl: './workflow-editor.component.html',
    styleUrls: ['./workflow-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowEditorComponent implements AfterViewInit {
    readonly title: string;
    readonly layer: Layer;

    @ViewChild("widget")
    widgetRef!: ElementRef;

    loading: boolean = true;
    readonly widgetModel = {
        data: {} as WidgetModel,
        listeners: {} as Record<string, (msg: any, buffers: DataView[]) => void>,
        get: function <K extends keyof WidgetModel>(key: K): WidgetModel[K] {
            return this.data[key];
        },
        set: function <K extends keyof WidgetModel>(key: K, value: WidgetModel[K]): void {
            const oldValue = this.data[key];

            if (oldValue !== value) {
                this.data[key] = value;
                this.listeners["change:" + key]?.call(this, null, []);
            }
        },
        off: function (eventName?: string, callback?: (...args: any[]) => void): void {
            throw new Error('Function not implemented.');
        },
        on: function (eventName: string, callback: (msg: any, buffers: DataView[]) => void): void {
            this.listeners[eventName] = callback;
        },
        save_changes: function (): void {
            throw new Error('Function not implemented.');
        },
        send: function (content: any, callbacks?: any, buffers?: ArrayBuffer[] | ArrayBufferView[] | undefined): void {
            throw new Error('Function not implemented.');
        },
        widget_manager: undefined
    };

    constructor(
        private elementRef: ElementRef,
        private projectService: ProjectService,
        private layoutService: LayoutService,
        private readonly userService: UserService,
        private dialogRef: MatDialogRef<WorkflowEditorComponent>,
        @Inject(MAT_DIALOG_DATA) private config: { layer: Layer },
    ) {
        this.layer = this.config.layer;
        this.title = `Workflow Editor for ${this.layer.name}`;
        this.userService.getSessionStream().subscribe(session => {
            this.widgetModel.set("token", session.sessionToken);
            this.widgetModel.set("serverUrl", session.apiConfiguration.basePath);
        });
    }

    ngAfterViewInit(): void {
        this.projectService.getWorkflow(this.layer.workflowId).subscribe(workflow => {
            this.loading = false;
            this.widgetModel
            render({
                model: this.widgetModel,
                el: this.widgetRef.nativeElement
            });
        });
    }
}
