import {HttpEventType} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, UntypedFormBuilder, ValidatorFn, Validators} from '@angular/forms';
import moment from 'moment';
import {combineLatest, mergeMap, Subscription} from 'rxjs';
import {RasterResultDescriptorDict, WcsParamsDict} from '../backend/backend.model';
import {BackendService} from '../backend/backend.service';
import {RasterLayer} from '../layers/layer.model';
import {MapService} from '../map/map.service';
import {NotificationService} from '../notification.service';
import {ProjectService} from '../project/project.service';
import {SpatialReferenceService} from '../spatial-references/spatial-reference.service';
import {Time} from '../time/time.model';
import {UserService} from '../users/user.service';
import {geoengineValidators} from '../util/form.validators';
import {bboxAsOgcString, gridOffsetsAsOgcString, gridOriginAsOgcString} from '../util/spatial_reference';

@Component({
    selector: 'geoengine-download-raster-layer',
    templateUrl: './download-raster-layer.component.html',
    styleUrls: ['./download-raster-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadRasterLayerComponent implements OnInit, OnDestroy {
    @Input() layer!: RasterLayer;

    readonly interpolationMethods = [
        ['Nearest Neighbor', 'nearestNeighbor'],
        ['Bilinear', 'biLinear'],
    ];

    form: FormGroup;

    bbox: [number, number, number, number] = [-180, 180, -90, 90];

    private projectTimeSubscription?: Subscription;

    constructor(
        protected backend: BackendService,
        protected projectService: ProjectService,
        protected userService: UserService,
        protected mapService: MapService,
        protected notificationService: NotificationService,
        protected spatialReferenceService: SpatialReferenceService,
        private formBuilder: UntypedFormBuilder,
    ) {
        // initialize with the current time to have a defined value
        const time = new Time(moment.utc(), moment.utc());

        this.form = this.formBuilder.group({
            bboxMinX: new FormControl(-180.0, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            bboxMaxX: new FormControl(180.0, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            bboxMinY: new FormControl(-90.0, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            bboxMaxY: new FormControl(90.0, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            timeInterval: new FormControl(
                {start: time.start, timeAsPoint: true, end: time.end},
                {nonNullable: true, validators: [Validators.required]},
            ),
            interpolationMethod: new FormControl(this.interpolationMethods[0][1], {
                nonNullable: true,
                validators: [Validators.required],
            }),
            inputResolution: new FormControl('source', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            inputResolutionX: new FormControl(1.0, {
                nonNullable: true,
                validators: [this.resolutionValidator()],
            }),
            inputResolutionY: new FormControl(1.0, {
                nonNullable: true,
                validators: [this.resolutionValidator()],
            }),
        });
    }

    ngOnInit(): void {
        this.projectTimeSubscription = this.projectService.getTimeStream().subscribe((t) => {
            const time = t.clone();

            this.form.controls['timeInterval'].setValue({
                start: time.start,
                end: time.end,
                timeAsPoint: time.start.isSame(time.end),
            });
        });
    }

    ngOnDestroy(): void {
        this.projectTimeSubscription?.unsubscribe();
    }

    selectBox(): void {
        this.notificationService.info('Select region on the map');
        this.mapService.startBoxDrawInteraction((feature) => {
            const b = feature.getGeometry()?.getExtent();
            if (b) {
                this.form.controls['bboxMinX'].setValue(b[0]);
                this.form.controls['bboxMaxX'].setValue(b[2]);
                this.form.controls['bboxMinY'].setValue(b[1]);
                this.form.controls['bboxMaxY'].setValue(b[3]);
            }
        });
    }

    download(): void {
        if (this.form.invalid) {
            return;
        }

        combineLatest([
            this.projectService.getSpatialReferenceOnce(),
            this.userService.getSessionTokenForRequest(),
            this.projectService.getWorkflowMetaData(this.layer.workflowId),
        ])
            .pipe(
                mergeMap(([sref, sessionToken, resultDescriptor]) => {
                    const wcsUrn = sref.wcsUrn();
                    if (!wcsUrn) {
                        this.notificationService.error('Could not determine WCS URN for spatial reference');
                        throw new Error('Could not determine WCS URN for spatial reference');
                    }

                    if (resultDescriptor.type !== 'raster') {
                        throw new Error('Result descriptor is not of type raster');
                    }

                    const rasterRd = resultDescriptor as RasterResultDescriptorDict;

                    const [minX, maxX, minY, maxY] = [
                        this.form.controls['bboxMinX'].value,
                        this.form.controls['bboxMaxX'].value,
                        this.form.controls['bboxMinY'].value,
                        this.form.controls['bboxMaxY'].value,
                    ];

                    const bboxOgc = bboxAsOgcString(minX, maxX, minY, maxY, sref.srsString);

                    const inputResolution = this.form.controls['inputResolution'].value;

                    let resolution = {x: 1.0, y: 1.0};

                    if (inputResolution === 'source') {
                        if (!rasterRd.resolution) {
                            // TODO: do not allow selecting this in the first place, if no resolution is defined
                            throw new Error('Source resolution is not defined');
                        }
                        resolution = rasterRd.resolution;
                    } else if (inputResolution === 'value') {
                        resolution = {
                            x: this.form.controls['inputResolutionX'].value,
                            y: this.form.controls['inputResolutionY'].value,
                        };
                    }

                    const params: WcsParamsDict = {
                        service: 'WCS',
                        request: 'GetCoverage',
                        version: '1.1.1',
                        identifier: this.layer.workflowId,
                        boundingbox: `${bboxOgc},${wcsUrn}`,
                        format: 'image/tiff',
                        gridbasecrs: wcsUrn,
                        gridcs: 'urn:ogc:def:cs:OGC:0.0:Grid2dSquareCS',
                        gridtype: 'urn:ogc:def:method:WCS:1.1:2dSimpleGrid',
                        gridorigin: gridOriginAsOgcString(minX, maxY, sref.srsString),
                        gridoffsets: gridOffsetsAsOgcString(resolution.x, resolution.y, sref.srsString),
                        time: '2014-01-01T00:00:00.0Z', // TODO
                    };

                    return this.backend.downloadRasterLayer(this.layer.workflowId, sessionToken, params);
                }),
            )
            .subscribe({
                next: (event) => {
                    if (event.type !== HttpEventType.Response || event.body === null) {
                        return;
                    }

                    // TODO: derive file name from layer name?
                    const tiffFile = new File([event.body], 'download.tiff');
                    const url = window.URL.createObjectURL(tiffFile);

                    // trigger download
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = tiffFile.name;
                    anchor.click();
                },
                error: (error) => {
                    this.notificationService.error(`File download failed: ${error.message}`);
                },
            });
    }

    private resolutionValidator(): ValidatorFn {
        const validator = Validators.compose([Validators.required, geoengineValidators.largerThan(0.0)]);

        if (!validator) {
            throw Error('Invalid validator');
        }

        return geoengineValidators.conditionalValidator(validator, () => this.form?.get('inputResolution')?.value === 'value');
    }
}
