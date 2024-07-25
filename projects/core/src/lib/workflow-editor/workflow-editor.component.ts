import {Component, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Layer} from '@geoengine/common';
import {ProjectService} from "../project/project.service";
import {render, WidgetModel} from "workflow-editor";
import {UserService} from "../users/user.service";
import {BehaviorSubject, mergeMap} from "rxjs";
import {map} from "rxjs/operators";
import {NotificationService} from "../notification.service";
import {DatasetService} from "../datasets/dataset.service";

class WidgetModelWrapper {
    data: WidgetModel = {} as any;
    listeners: Record<string, ((msg: any, buffers: DataView[]) => void)[]> = {};
    widget_manager: undefined;

    get<K extends keyof WidgetModel>(key: K): WidgetModel[K] {
        return this.data[key];
    }

    set<K extends keyof WidgetModel>(key: K, value: WidgetModel[K]): void {
        const oldValue = this.data[key];

        if (oldValue !== value) {
            this.data[key] = value;
            this.listeners["change:" + key]?.forEach(listener => listener.call(this, null, []));
        }
    }

    off(_eventName?: string, _callback?: (...args: any[]) => void): void {
        throw new Error('Function not implemented.');
    }

    on(eventName: string, callback: (msg: any, buffers: DataView[]) => void): void {
        let selectedListeners = this.listeners[eventName];

        if (selectedListeners) {
            selectedListeners.push(callback);
        } else {
            this.listeners[eventName] = [callback];
        }
    }

    save_changes(): void {
        //noop
    }

    send(_content: any, _callbacks?: any, _buffers?: ArrayBuffer[] | ArrayBufferView[] | undefined): void {
        throw new Error('Function not implemented.');
    }
}

@Component({
    selector: 'geoengine-workflow-editor',
    templateUrl: './workflow-editor.component.html',
    styleUrls: ['./workflow-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowEditorComponent implements AfterViewInit {
    readonly title: string;
    readonly layerName: string;
    readonly layer?: Layer;

    @ViewChild("widget")
    readonly widgetRef!: ElementRef;
    readonly loading$;
    readonly isValid$ = new BehaviorSubject(false);
    readonly widgetModel = new WidgetModelWrapper();

    constructor(
        private elementRef: ElementRef,
        private projectService: ProjectService,
        private userService: UserService,
        private dialogRef: MatDialogRef<WorkflowEditorComponent>,
        private notificationService: NotificationService,
        private datasetService: DatasetService,
        @Inject(MAT_DIALOG_DATA) private config: { layerOrNewName: Layer | string },
    ) {
        if (typeof this.config.layerOrNewName === "string") {
            this.layerName = this.config.layerOrNewName;
            this.loading$ = new BehaviorSubject(false);
        } else {
            this.layer = this.config.layerOrNewName;
            this.layerName = this.layer.name;
            this.loading$ = new BehaviorSubject(true);
        }
        this.title = `Workflow Editor for ${this.layerName}`;
        this.userService.getSessionStream().subscribe(session => {
            this.widgetModel.set("token", session.sessionToken);
            this.widgetModel.set("serverUrl", session.apiConfiguration.basePath);
        });
        this.widgetModel.on("change:workflow", () => {
            const workflow = this.widgetModel.get("workflow");
            this.isValid$.next(workflow != null);
        });
    }

    ngAfterViewInit(): void {
        if (this.layer) {
            this.projectService.getWorkflow(this.layer.workflowId).subscribe(workflow => {
                this.widgetModel.set("workflow", workflow as any);
                render({
                    model: this.widgetModel,
                    el: this.widgetRef.nativeElement
                });
                this.loading$.next(false);
            });
        } else {
            render({
                model: this.widgetModel,
                el: this.widgetRef.nativeElement
            });
        }
    }

    onSave() {
        const layerCopy = this.layer;

        if (layerCopy) {
            this.projectService.registerWorkflow(this.widgetModel.get("workflow")!).pipe(
                map(workflowId => this.projectService.changeLayer(layerCopy, {
                    workflowId
                }))
            ).subscribe(() => {
                this.dialogRef.close();
                this.notificationService.info(`Updated layer »${this.layerName}«`);
            });
        } else {
            this.projectService.registerWorkflow(this.widgetModel.get("workflow")!).pipe(
                mergeMap(workflowId => this.datasetService.createLayerFromWorkflow(this.layerName, workflowId)),
                map(layer => this.projectService.addLayer(layer))
            ).subscribe(() => {
                this.dialogRef.close();
            })
        }
    }
}
