import {first} from 'rxjs/operators';
import {Subscription} from 'rxjs';

import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy, Inject} from '@angular/core';
import {WFSOutputFormats} from '../../../queries/output-formats/wfs-output-format.model';
import {WCSOutputFormats} from '../../../queries/output-formats/wcs-output-format.model';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Layer} from '../../layer.model';
import {AbstractSymbology} from '../../symbology/symbology.model';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ResultTypes} from '../../../operators/result-type.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {ProjectService} from '../../../project/project.service';

interface LayerExportComponentConfig {
    layer: Layer<AbstractSymbology>;
}

@Component({
    selector: 'wave-layer-export',
    templateUrl: './layer-export.component.html',
    styleUrls: ['./layer-export.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerExportComponent implements OnInit, AfterViewInit, OnDestroy {
    // make available
    WFSOutputFormats = WFSOutputFormats;
    WCSOutputFormats = WCSOutputFormats;
    //

    form: FormGroup;

    layer: Layer<AbstractSymbology>;

    isRaster: boolean;
    isVector: boolean;

    private subscriptions: Array<Subscription> = [];

    constructor(
        private formBuilder: FormBuilder,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        @Inject(MAT_DIALOG_DATA) private config: LayerExportComponentConfig,
    ) {}

    ngOnInit() {
        // const config = this.dialogRef.config as LayerExportComponentConfig;
        this.layer = this.config.layer;

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
            (this.form.controls['rasterResolution'] as FormGroup).controls['width'].valueChanges.subscribe((width) => {
                (this.form.controls['rasterResolution'] as FormGroup).controls['height'].setValue(width);
            }),
        );
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity());
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    download() {
        this.projectService
            .getProjectStream()
            .pipe(first())
            .subscribe((project) => {
                if (this.isVector) {
                    location.href = this.mappingQueryService.getWFSQueryUrl({
                        operator: this.layer.operator,
                        outputFormat: this.form.controls['dataOutputFormat'].value,
                        time: project.time,
                        projection: project.projection,
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
                        time: project.time,
                        projection: project.projection,
                    });
                }
            });
    }
}
