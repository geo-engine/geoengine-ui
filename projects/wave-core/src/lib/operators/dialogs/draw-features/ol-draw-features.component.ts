import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {MapService} from '../../../map/map.service';
import OlFormatGeoJson from 'ol/format/GeoJSON';
import {Vector as OlVectorSource} from 'ol/source';
import OlGeometryType from 'ol/geom/GeometryType';
import {Projections, Projection} from '../../projection.model';
import {Operator} from '../../operator.model';
import {
    AbstractVectorSymbology,
    LineSymbology,
    PointSymbology,
    VectorSymbology
} from '../../../layers/symbology/symbology.model';
import {UnexpectedResultType} from '../../../util/errors';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {NotificationService} from '../../../notification.service';
import {Subscription} from 'rxjs';
import {OgrRawSourceType} from '../../types/ogr-raw-source-type.model';
import {DataTypes} from '../../datatype.model';
import {Map as ImmutableMap} from 'immutable';
import {Unit} from '../../unit.model';

@Component({
    selector: 'wave-ol-draw-features',
    templateUrl: './ol-draw-features.component.html',
    styleUrls: ['./ol-draw-features.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OlDrawFeaturesComponent implements OnDestroy {

    featureTypes = [ResultTypes.POLYGONS, ResultTypes.POINTS, ResultTypes.LINES];
    selectedFeatureType: ResultType;
    olGeometryType: OlGeometryType;

    isDrawingActive = false;
    olFeatureWriter = new OlFormatGeoJson();

    featureLayerName = 'new feature layer';

    mapProjection: Projection;
    mapProjectionSubscription: Subscription;

    constructor(
        private mapService: MapService,
        private projectService: ProjectService,
        private randomColorService: RandomColorService,
        private notificationService: NotificationService
    ) {
        this.mapProjectionSubscription = projectService.getProjectionStream().subscribe(p => this.mapProjection = p);
    }

    ngOnDestroy(): void {
        if (this.isDrawingActive) {
            this.cancelDrawing();
        }
        this.mapProjectionSubscription.unsubscribe();
    }

    updateFeatureType(resultType: ResultType) {
        this.selectedFeatureType = resultType;

        switch (resultType) {
            case ResultTypes.POINTS:
                this.olGeometryType = OlGeometryType.POINT;
                break;
            case ResultTypes.POLYGONS:
                this.olGeometryType = OlGeometryType.POLYGON;
                break;
            case ResultTypes.LINES:
                this.olGeometryType = OlGeometryType.LINE_STRING;
                break;
            default:
                throw new UnexpectedResultType();
        }
    }

    startDrawing() {
        this.isDrawingActive = true;
        this.mapService.startDrawInteraction(this.olGeometryType);
        this.notificationService.info('Start drawing…');
    }

    cancelDrawing() {
        this.isDrawingActive = false;
        this.mapService.endDrawInteraction();
        this.notificationService.info('Draw features canceled.');
    }

    endDrawing() {
        this.isDrawingActive = false;
        const olSource = this.mapService.endDrawInteraction();
        if (olSource.getFeatures().length > 0) {
            this.createAndAddOperatorFromSource(olSource);
        } else {
            this.notificationService.info('Empty layer skipped.');
        }
    }

    private createAndAddOperatorFromSource(olSource: OlVectorSource) {
        let resultSymbology: AbstractVectorSymbology;

        switch (this.selectedFeatureType) {
            case ResultTypes.POINTS:
                resultSymbology = PointSymbology.createSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            case ResultTypes.POLYGONS:
                resultSymbology = VectorSymbology.createSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            case ResultTypes.LINES:
                resultSymbology = LineSymbology.createSymbology({
                    strokeRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        resultSymbology.textAttribute = 'id';

        const geoJson = this.olFeatureWriter.writeFeaturesObject(olSource.getFeatures(), {
            featureProjection: this.mapProjection.getCode(),
            dataProjection: Projections.WGS_84.getCode()
        });

        // add `id` attribute to each feature
        for (let i = 0; i < geoJson.features.length; ++i) {
            geoJson.features[i].properties = {id: i + 1};
        }

        const dataUrl = `data:text/json,${encodeURIComponent(JSON.stringify(geoJson))}`;

        const sourceType = new OgrRawSourceType({
            filename: dataUrl,
            time: 'none',
            columns: {
                numeric: ['id'],
                textual: [],
            },
            on_error: 'abort',
        });

        const operator = new Operator({
            operatorType: sourceType,
            resultType: this.selectedFeatureType,
            projection: Projections.WGS_84,
            attributes: ['id'],
            dataTypes: ImmutableMap({id: DataTypes.UInt32}),
            units: ImmutableMap({id: Unit.defaultUnit}),
        });

        const layer = new VectorLayer({
            name: this.featureLayerName,
            operator,
            symbology: resultSymbology,
            clustered: false,
        });

        this.projectService.addLayer(layer);
    }

}
