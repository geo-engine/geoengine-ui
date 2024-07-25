import { ChangeDetectionStrategy, Component } from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {WorkflowEditorComponent} from "../../workflow-editor/workflow-editor.component";
import {LayoutService} from "../../layout.service";

@Component({
  selector: 'geoengine-create-workflow',
  templateUrl: './create-workflow.component.html',
  styleUrl: './create-workflow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateWorkflowComponent {
    readonly form: UntypedFormGroup;

    constructor(
        protected readonly dialog: MatDialog,
        protected readonly layoutService: LayoutService
    ) {
        this.form = new UntypedFormGroup({
            layerName: new UntypedFormControl('New Layer', Validators.required)
        });
    }

    openEditor(): void {
        this.layoutService.setSidenavContentComponent(undefined);
        const layerName: string = this.form.controls.layerName.value;
        this.dialog.open(WorkflowEditorComponent, {data: {layerOrNewName: layerName}});
    }
}
