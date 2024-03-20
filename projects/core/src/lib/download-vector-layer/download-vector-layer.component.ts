import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, UntypedFormBuilder, ValidatorFn, Validators} from '@angular/forms';
import moment from 'moment';
import {combineLatest, mergeMap, Subscription} from 'rxjs';
import {TimeIntervalDict, WfsParamsDict} from '../backend/backend.model';
import {BackendService} from '../backend/backend.service';
import {MapService} from '../map/map.service';
import {NotificationService} from '../notification.service';
import {ProjectService} from '../project/project.service';
import {SpatialReferenceService} from '../spatial-references/spatial-reference.service';
import {TimeInterval} from '../time/time-interval-input/time-interval-input.component';
import {UserService} from '../users/user.service';
import {geoengineValidators} from '../util/form.validators';
import {extentToBboxDict, VectorLayer, SpatialReference, Time, olExtentToTuple} from '@geoengine/common';
import {TypedResultDescriptor} from '@geoengine/openapi-client';

export interface DownloadVectorLayerForm {
    bboxMinX: FormControl<number>;
    bboxMaxX: FormControl<number>;
    bboxMinY: FormControl<number>;
    bboxMaxY: FormControl<number>;

    timeInterval: FormControl<TimeInterval>;

    resolution: FormControl<number>;
}

@Component({
    selector: 'geoengine-download-raster-layer',
    templateUrl: './download-vector-layer.component.html',
    styleUrls: ['./download-vector-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadVectorLayerComponent implements OnInit, OnDestroy {
    @Input() layer!: VectorLayer;

    form: FormGroup<DownloadVectorLayerForm>;

    isSelectingBox = false;

    private projectTimeSubscription?: Subscription;
    private viewportSizeSubscription?: Subscription;

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
            resolution: new FormControl(1.0, {
                nonNullable: true,
                validators: [this.resolutionValidator()],
            }),
        });

        this.updateRegionByExtent(olExtentToTuple(this.mapService.getViewportSize().extent));
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

        this.viewportSizeSubscription = this.mapService.getViewportSizeStream().subscribe((viewport) => {
            const extent = olExtentToTuple(viewport.extent);

            this.updateRegionByExtent(extent);
        });
    }

    ngOnDestroy(): void {
        this.projectTimeSubscription?.unsubscribe();
        this.viewportSizeSubscription?.unsubscribe();
    }

    selectBox(): void {
        this.isSelectingBox = true;
        this.notificationService.info('Select region on the map');
        this.mapService.startBoxDrawInteraction((feature) => {
            const b = feature.getGeometry()?.getExtent();
            if (b) {
                this.form.controls['bboxMinX'].setValue(b[0]);
                this.form.controls['bboxMaxX'].setValue(b[2]);
                this.form.controls['bboxMinY'].setValue(b[1]);
                this.form.controls['bboxMaxY'].setValue(b[3]);
            }
            this.isSelectingBox = false;
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
                    const params: WfsParamsDict = this.makeWfsParams(sref, resultDescriptor);

                    return this.backend.wfsGetFeature(params, sessionToken);
                }),
            )
            .subscribe({
                next: (json) => {
                    const jsonFile = new File([JSON.stringify(json)], `${this.layer.name}.json`);
                    const url = window.URL.createObjectURL(jsonFile);

                    // trigger download
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = jsonFile.name;
                    anchor.click();
                },
                error: (error) => {
                    this.notificationService.error(`File download failed: ${error.message}`);
                },
            });
    }

    private updateRegionByExtent(extent: [number, number, number, number]): void {
        this.form.controls['bboxMinX'].setValue(extent[0]);
        this.form.controls['bboxMinY'].setValue(extent[1]);
        this.form.controls['bboxMaxX'].setValue(extent[2]);
        this.form.controls['bboxMaxY'].setValue(extent[3]);
    }

    private makeWfsParams(sref: SpatialReference, resultDescriptor: TypedResultDescriptor): WfsParamsDict {
        if (resultDescriptor.type !== 'vector') {
            throw new Error('Result descriptor is not of type vector');
        }

        const extent: [number, number, number, number] = [
            this.form.controls['bboxMinX'].value,
            this.form.controls['bboxMinY'].value,
            this.form.controls['bboxMaxX'].value,
            this.form.controls['bboxMaxY'].value,
        ];

        const bbox = extentToBboxDict(extent);

        const time = this.formToTimeInterval();

        const resolution = this.formToResolution();

        return {
            bbox: bbox,
            queryResolution: resolution,
            time: time,
            srsName: sref.srsString,
            workflowId: this.layer.workflowId,
        };
    }

    private formToResolution(): number {
        return this.form.controls['resolution'].value;
    }

    private formToTimeInterval(): TimeIntervalDict {
        const timeInterval = this.form.get('timeInterval')?.value as TimeInterval;

        const start = timeInterval.start;
        const timeAsPoint = timeInterval.timeAsPoint;
        let end = timeInterval.end;

        if (timeAsPoint) {
            end = start;
        }

        return new Time(start, end).toDict();
    }

    private resolutionValidator(): ValidatorFn {
        const validator = Validators.compose([Validators.required, geoengineValidators.largerThan(0.0)]);

        if (!validator) {
            throw Error('Invalid validator');
        }

        return geoengineValidators.conditionalValidator(validator, () => this.form?.get('inputResolution')?.value === 'value');
    }
}
