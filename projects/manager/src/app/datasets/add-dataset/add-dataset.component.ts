import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

enum SourceOperators {
    GdalSource,
    OgrSource,
}

enum DataPaths {
    Upload,
    Volume,
}

export interface AddDatasetForm {
    name: FormControl<string>;
    displayName: FormControl<string>;
    sourceOperator: FormControl<SourceOperators>;
    dataPathType: FormControl<DataPaths>;
    dataPath: FormControl<string>;
}

@Component({
    selector: 'geoengine-manager-add-dataset',
    templateUrl: './add-dataset.component.html',
    styleUrl: './add-dataset.component.scss',
})
export class AddDatasetComponent {
    DataPaths = DataPaths;
    SourceOperators = SourceOperators;

    form: FormGroup<AddDatasetForm> = new FormGroup<AddDatasetForm>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/), Validators.minLength(1)],
        }),
        displayName: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        sourceOperator: new FormControl(SourceOperators.GdalSource, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        dataPathType: new FormControl(DataPaths.Upload, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        dataPath: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
    });

    updateSourceOperator(): void {}

    updateDataPath(): void {}
}
