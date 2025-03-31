import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import OlFormatGeoJson from 'ol/format/GeoJSON';
import {Type as OlGeometryType} from 'ol/geom/Geometry';
import {BehaviorSubject, of, Subject, Subscription} from 'rxjs';
import {ProjectService} from '../../project/project.service';
import {MapService} from '../../map/map.service';
import {DatasetService} from '../dataset.service';
import {HttpEventType, HttpResponse} from '@angular/common/http';
import {AutoCreateDatasetDict, UploadResponseDict, UUID} from '../../backend/backend.model';
import {mergeMap} from 'rxjs/operators';
import {WGS_84} from '../../spatial-references/spatial-reference.service';
import {NotificationService, ResultType, ResultTypes, SpatialReference} from '@geoengine/common';

enum State {
    Start = 1,
    Finished = 2,
}

/**
 * The feature draw component. Together with the MapService it allows to add new features by drawing them on the map.
 */
@Component({
    selector: 'geoengine-draw-features',
    templateUrl: './draw-features.component.html',
    styleUrls: ['./draw-features.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DrawFeaturesComponent implements OnDestroy, OnInit {
    readonly State = State;

    indicateLoading$ = new Subject<boolean>();
    uploadId$ = new Subject<UUID>();

    state$ = new BehaviorSubject(State.Start);

    // the list of supported feature types
    featureTypes = [ResultTypes.POINTS, ResultTypes.POLYGONS];
    // the current feature type
    selectedFeatureType: ResultType = ResultTypes.POINTS;
    // the corresponding open layers geometry type
    olGeometryType: OlGeometryType = 'Point';

    // the open layers feature writer - we use GeoJson
    olFeatureWriter = new OlFormatGeoJson();

    datasetName = 'Drawn Features';
    datasetDescription = '';

    // the projection of the map
    mapSpatialRef?: SpatialReference;
    // a subscription providing the map projection and updates if it changes
    mapProjectionSubscription: Subscription;

    constructor(
        private projectService: ProjectService,
        private mapService: MapService,
        private datasetService: DatasetService,
        private notificationService: NotificationService,
    ) {
        this.mapProjectionSubscription = this.projectService.getSpatialReferenceStream().subscribe((p) => (this.mapSpatialRef = p));
    }
    ngOnInit(): void {
        this.startDrawing();
    }

    ngOnDestroy(): void {
        if (this.state$.value !== State.Finished) {
            this.mapService.endDrawInteraction();
        }
        this.mapProjectionSubscription.unsubscribe();
    }

    updateFeatureType(resultType: ResultType): void {
        this.selectedFeatureType = resultType;

        switch (resultType) {
            case ResultTypes.POINTS:
                this.olGeometryType = 'Point';
                break;
            case ResultTypes.POLYGONS:
                this.olGeometryType = 'Polygon';
                break;
            case ResultTypes.LINES:
                this.olGeometryType = 'LineString';
                break;
            default:
                throw new Error('Unexpected result type');
        }

        this.resetDrawing();
    }

    startDrawing(): void {
        this.mapService.startDrawInteraction(this.olGeometryType);
        this.notificationService.info('Start drawing…');
    }

    resetDrawing(): void {
        this.mapService.endDrawInteraction();
        this.mapService.startDrawInteraction(this.olGeometryType);
    }

    startBoxDrawing(): void {
        this.mapService.startBoxDrawInteraction();
        this.notificationService.info('Start Box drawing…');
    }

    submitCreate(): void {
        const olSource = this.mapService.endDrawInteraction();

        if (!olSource) {
            return;
        }

        const geoJson = this.olFeatureWriter.writeFeaturesObject(olSource.getFeatures(), {
            featureProjection: this.mapSpatialRef?.srsString,
            dataProjection: WGS_84.spatialReference.srsString,
        });

        if (geoJson.features.length === 0) {
            this.notificationService.error('Cannot add empty layer to map');
            this.startDrawing();
            return;
        }

        this.indicateLoading$.next(true);

        // add `id` attribute to each feature
        for (let i = 0; i < geoJson.features.length; ++i) {
            geoJson.features[i].properties = {id: i + 1};
        }

        const blob = new Blob([JSON.stringify(geoJson)], {type: 'application/json'});

        const form = new FormData();
        form.append('file', blob, 'draw.json');

        this.datasetService
            .upload(form)
            .pipe(
                mergeMap((event) => {
                    if (event.type !== HttpEventType.Response) {
                        return of<UploadResponseDict>(); // filter out
                    }

                    const httpResponse: HttpResponse<UploadResponseDict> = event as unknown as HttpResponse<UploadResponseDict>;

                    if (!httpResponse.body) {
                        return of<UploadResponseDict>(); // filter out
                    }

                    return of(httpResponse.body);
                }),
                mergeMap((response: UploadResponseDict) => {
                    const uploadId = response.id;
                    const create: AutoCreateDatasetDict = {
                        upload: uploadId,
                        datasetName: this.datasetName,
                        datasetDescription: this.datasetDescription,
                        mainFile: 'draw.json',
                    };
                    return this.datasetService.autoCreateDataset(create);
                }),
                mergeMap((res) => this.datasetService.getDataset(res.datasetName)),
                mergeMap((dataset) => this.datasetService.addDatasetToMap(dataset)),
            )
            .subscribe({
                next: (_) => {
                    this.indicateLoading$.next(false);
                    this.state$.next(State.Finished);
                },
                error: (err) => {
                    this.notificationService.error('Create dataset failed: ' + err.message);
                    this.indicateLoading$.next(false);
                },
            });
    }
}
