import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup} from '@angular/common';

import {BehaviorSubject, Subscription} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {MD_RADIO_DIRECTIVES, MdRadioDispatcher} from '@angular2-material/radio';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import {DefaultBasicDialog} from '../../dialogs/basic-dialog.component';

import {MappingQueryService} from '../../queries/mapping-query.service';
import {WFSOutputFormats} from '../../queries/output-formats/wfs-output-format.model';
import {WCSOutputFormats} from '../../queries/output-formats/wcs-output-format.model';
import {ResultTypes} from '../../operators/result-type.model';

import {LayerService} from '../layer.service';
import {Layer} from '../layer.model';
import {Symbology} from '../../symbology/symbology.model';

@Component({
    selector: 'wave-export-dialog',
    template: `
    <form [ngFormModel]="form" layout="column">
        <md-input
            type="text"
            placeholder="Export Name"
            value="export"
            [disabled]="true"
        ></md-input>
        <p>Data Output Type:</p>
        <md-radio-group ngControl="dataOutputType" layout="column" *ngIf="isVector">
            <md-radio-button
                *ngFor="let type of WFSOutputFormats.EXPORT_TYPES"
                [value]="type"
            >{{type}}</md-radio-button>
        </md-radio-group>
        <md-radio-group ngControl="dataOutputType" layout="column" *ngIf="isRaster">
            <md-radio-button
                *ngFor="let type of WCSOutputFormats.EXPORT_TYPES"
                [value]="type"
            >{{type}}</md-radio-button>
        </md-radio-group>
        <p>Citation Type:</p>
        <md-radio-group layout="column">
            <md-radio-button value="json" checked="true">JSON</md-radio-button>
        </md-radio-group>
    </form>
    `,
    styles: [`
    form {
        margin-top: 16px;
        margin-bottom: 16px;
    }
    md-radio-button >>> .md-radio-label-content {
        float: none;
    }
    `],
    providers: [MdRadioDispatcher],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        MD_RADIO_DIRECTIVES,
    ],
    pipes: [],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ExportDialogComponent extends DefaultBasicDialog implements OnInit, OnDestroy {
    // make this available in the template
    // tslint:disable:variable-name
    WFSOutputFormats = WFSOutputFormats;
    WCSOutputFormats = WCSOutputFormats;
    // tslint:enable

    form: ControlGroup;

    layer: Layer<Symbology>;
    isRaster: boolean;
    isVector: boolean;

    private saveButtonSubscription: Subscription;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private formBuilder: FormBuilder
    ) {
        super();
        this.layer = this.layerService.getSelectedLayer();

        this.isVector = ResultTypes.VECTOR_TYPES.indexOf(this.layer.operator.resultType) >= 0;
        this.isRaster = this.layer.operator.resultType === ResultTypes.RASTER;

        this.form = this.formBuilder.group({
            dataOutputType: [
                this.isVector ? WFSOutputFormats.EXPORT_TYPES[0] : WCSOutputFormats.EXPORT_TYPES[0],
                Validators.required,
            ],
        });
    }

    ngOnInit() {
        this.dialog.setTitle('Export');

        const saveButtonDisabled$ = new BehaviorSubject(false);
        this.saveButtonSubscription = this.form.valueChanges.map(_ => {
            return !!this.form.errors && Object.keys(this.form.errors).length > 0;
        }).subscribe(
            saveButtonDisabled$
        );
        this.dialog.setButtons([
            {
                title: 'Cancel',
                action: () => this.dialog.close(),
            },
            {
                title: 'Download',
                action: () => this.download(),
                disabled: saveButtonDisabled$,
            },
        ]);
    }

    ngOnDestroy() {
        this.saveButtonSubscription.unsubscribe();
    }

    download() {
        if (this.isVector) {
            location.href = this.mappingQueryService.getWFSQueryUrl({
                operator: this.layer.operator,
                outputFormat: this.form.controls['dataOutputType'].value,
            });
        }

        if (this.isRaster) {
            location.href = this.mappingQueryService.getWCSQueryUrl({
                operator: this.layer.operator,
                outputFormat: this.form.controls['dataOutputType'].value,
            });
        }

        this.dialog.close();
    }

}
