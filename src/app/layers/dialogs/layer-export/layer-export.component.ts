import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy} from '@angular/core';
import {WFSOutputFormats} from '../../../queries/output-formats/wfs-output-format.model';
import {WCSOutputFormats} from '../../../queries/output-formats/wcs-output-format.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Layer} from '../../layer.model';
import {Symbology} from '../../../../symbology/symbology.model';
import {MdDialogRef} from '@angular/material';
import {ResultTypes} from '../../../operators/result-type.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {Subscription} from 'rxjs';

interface LayerExportComponentConfig {
    layer: Layer<Symbology>;
}

@Component({
    selector: 'wave-layer-export',
    templateUrl: './layer-export.component.html',
    styleUrls: ['./layer-export.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerExportComponent implements OnInit, AfterViewInit, OnDestroy {

    // make available
    WFSOutputFormats = WFSOutputFormats;
    WCSOutputFormats = WCSOutputFormats;
    //

    form: FormGroup;

    layer: Layer<Symbology>;

    isRaster: boolean;
    isVector: boolean;

    private subscriptions: Array<Subscription> = [];

    constructor(private dialogRef: MdDialogRef<LayerExportComponent>,
                private formBuilder: FormBuilder,
                private mappingQueryService: MappingQueryService) {
    }

    ngOnInit() {
        const config = this.dialogRef.config as LayerExportComponentConfig;
        this.layer = config.layer;

        this.isRaster = this.layer.operator.resultType === ResultTypes.RASTER;
        this.isVector = ResultTypes.VECTOR_TYPES.indexOf(this.layer.operator.resultType) >= 0;

        if (this.isRaster && this.isVector) {
            throw Error('The layer must be of type raster OR vector');
        }

        this.form = this.formBuilder.group({
            outputName: [{value: 'export', disabled: true}, Validators.required],
            dataOutputFormat: [undefined, Validators.required],
            citationFormat: ['json', Validators.required],
            rasterResolution: this.formBuilder.group({
                width: [1024, Validators.required],
                height: [{value: 1024, disabled: true}, Validators.required],
            }),
        });

        this.subscriptions.push(
            (this.form.controls['rasterResolution'] as FormGroup).controls['width'].valueChanges.subscribe(width => {
                (this.form.controls['rasterResolution'] as FormGroup).controls['height'].setValue(width);
            })
        );
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    download() {
        if (this.isVector) {
            location.href = this.mappingQueryService.getWFSQueryUrl({
                operator: this.layer.operator,
                outputFormat: this.form.controls['dataOutputFormat'].value,
            });
        }

        if (this.isRaster) {
            const rasterResolution = this.form.controls['rasterResolution'] as FormGroup;

            location.href = this.mappingQueryService.getWCSQueryUrl({
                operator: this.layer.operator,
                outputFormat: this.form.controls['dataOutputFormat'].value,
                size: {
                    x: rasterResolution.controls['width'].value,
                    y: rasterResolution.controls['height'].value,
                },
            });
        }
    }

}
