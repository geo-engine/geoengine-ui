import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {MapService} from '../../../map/map.service';
import {WKT as OlFormatWKT} from 'ol/format';
import {Vector as OlVectorSource} from 'ol/source';
import OlGeometryType from 'ol/geom/GeometryType';
import {Projections, Projection} from '../../projection.model';
import {Operator} from '../../operator.model';
import {AbstractVectorSymbology, ComplexPointSymbology, ComplexVectorSymbology} from '../../../layers/symbology/symbology.model';
import {UnexpectedResultType} from '../../../util/errors';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {WKTSourceType} from '../../types/wkt-source-type.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {NotificationService} from '../../../notification.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-ol-draw-features',
    templateUrl: './ol-draw-features.component.html',
    styleUrls: ['./ol-draw-features.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OlDrawFeaturesComponent implements OnDestroy {

    featureTypes = [ResultTypes.POLYGONS, ResultTypes.POINTS];
    selectedFeatureType: ResultType;
    olGeometryType: OlGeometryType;

    isDrawingActive = false;
    olFeatureWriter = new OlFormatWKT();

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
        this.notificationService.info('Draw features canceled.')
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
                resultSymbology = ComplexPointSymbology.createSimpleSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            case ResultTypes.POLYGONS:
                resultSymbology = ComplexVectorSymbology.createSimpleSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        let wkt = this.olFeatureWriter.writeFeatures(olSource.getFeatures(), {
            featureProjection: this.mapProjection.getCode(),
            dataProjection: Projections.WGS_84.getCode()
        });

        // handle layers with only one input
        if (olSource.getFeatures().length === 1) {
            wkt = 'GEOMETRYCOLLECTION(' + wkt + ')'
        }

        const sourceType = new WKTSourceType({
            wkt: wkt,
            type: this.selectedFeatureType,
        });

        const operator = new Operator({
            operatorType: sourceType,
            resultType: this.selectedFeatureType,
            projection: Projections.WGS_84,
        });

        const layer = new VectorLayer({
            name: this.featureLayerName,
            operator: operator,
            symbology: resultSymbology,
            clustered: false,
        });

        this.projectService.addLayer(layer);
    }

}
