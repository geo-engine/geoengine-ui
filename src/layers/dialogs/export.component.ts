import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs/Rx';

import Config from '../../app/config.model';

import {ProjectService} from '../../project/project.service';
import {MappingQueryService} from '../../queries/mapping-query.service';

import {WFSOutputFormats} from '../../queries/output-formats/wfs-output-format.model';
import {WCSOutputFormats} from '../../queries/output-formats/wcs-output-format.model';
import {ResultTypes} from '../../operators/result-type.model';

import {LayerService} from '../layer.service';
import {Layer} from '../layer.model';
import {Symbology} from '../../symbology/symbology.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

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
        <div *ngIf="isRaster" ngControlGroup="resolution">
            <md-input
                type="number"
                placeholder="Resolution Width"
                ngControl="width"
            ></md-input>
            <md-input
                type="number"
                placeholder="Resolution Height"
                ngControl="height"
                [disabled]="true"
            ></md-input>
        </div>
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
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ExportDialogComponent implements OnInit, OnDestroy {
    // make this available in the template
    // tslint:disable:variable-name
    WFSOutputFormats = WFSOutputFormats;
    WCSOutputFormats = WCSOutputFormats;
    // tslint:enable

    form: FormGroup;

    layer: Layer<Symbology>;
    isRaster: boolean;
    isVector: boolean;

    private subscriptions: Array<Subscription> = [];

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder
    ) {
        // super();
        this.layer = this.layerService.getSelectedLayer();

        this.isVector = ResultTypes.VECTOR_TYPES.indexOf(this.layer.operator.resultType) >= 0;
        this.isRaster = this.layer.operator.resultType === ResultTypes.RASTER;

        this.form = this.formBuilder.group({
            dataOutputType: [
                this.isVector ? WFSOutputFormats.EXPORT_TYPES[0] : WCSOutputFormats.EXPORT_TYPES[0],
                Validators.required,
            ],
        });

        if (this.isRaster) {
            const DEFAULT_WIDTH = 1024;
            const extent = this.projectService.getProjection().getExtent();
            const quotient = Math.abs(extent[3] - extent[1]) / Math.abs(extent[2] - extent[0]);

            const minResolutionControl = this.formBuilder.control(
                DEFAULT_WIDTH,
                Validators.required
            );
            const maxResolutionControl = this.formBuilder.control(
                Math.round(DEFAULT_WIDTH * quotient),
                Validators.required
            );

            this.subscriptions.push(
                minResolutionControl.valueChanges.map(
                    value => Math.round(value * quotient)
                ).subscribe(
                    value => maxResolutionControl.setValue(value)
                )
            );

            this.subscriptions.push(
                minResolutionControl.valueChanges.debounceTime(
                    Config.DELAYS.DEBOUNCE
                ).filter(
                    value => isNaN(value)
                ).subscribe(
                    _ => minResolutionControl.setValue(DEFAULT_WIDTH)
                )
            );

            this.form.addControl(
                'resolution',
                this.formBuilder.group({
                    width: minResolutionControl,
                    height: maxResolutionControl,
                })
            );
        }
    }

    ngOnInit() {
        // this.dialog.setTitle('Export');
        //
        // const saveButtonDisabled$ = new BehaviorSubject(false);
        // this.subscriptions.push(
        //     this.form.valueChanges.map(_ => {
        //         return !!this.form.errors && Object.keys(this.form.errors).length > 0;
        //     }).subscribe(
        //         saveButtonDisabled$
        //     )
        // );
        // this.dialog.setButtons([
        //     {
        //         title: 'Cancel',
        //         action: () => this.dialog.close(),
        //     },
        //     {
        //         title: 'Download',
        //         action: () => this.download(),
        //         disabled: saveButtonDisabled$,
        //     },
        // ]);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
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
                size: {
                    x: this.form.controls['resolution'].value.width,
                    y: this.form.controls['resolution'].value.height,
                },
            });
        }

        // this.dialog.close();
    }

}
