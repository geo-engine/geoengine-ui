import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {MapService} from '../../../map/map.service';
import {WKT as OlFormatWKT} from 'ol/format';
import {Vector as OlVectorSource} from 'ol/source';
import {GeometryType as OlGeometryType} from 'ol/geom';


import {Projections, Projection} from '../../projection.model';
import {Operator} from '../../operator.model';
import {
    AbstractVectorSymbology, ComplexPointSymbology,
    ComplexVectorSymbology
} from '../../../layers/symbology/symbology.model';
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

export class OlDrawFeaturesComponent implements OnInit, OnDestroy {

    featureTypes = ['Polygon', 'Point'];
    selectedFeatureType: OlGeometryType;
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
            this.isDrawingActive = false;
            this.mapService.endDrawInteraction();
            this.notificationService.info('Draw features canceled.');
            this.mapProjectionSubscription.unsubscribe();
        }
    }

    startDrawing() {
        this.isDrawingActive = true;
        this.mapService.startDrawInteraction(this.selectedFeatureType);
        this.notificationService.info('Start drawing...')
    }

    endDrawing() {
        this.isDrawingActive = false;
        const olSource = this.mapService.endDrawInteraction();
        if (olSource.getFeatures().length > 0) {
            this.createAndAddOperatorFromSource(olSource);
        } else {
            this.notificationService.info('Empty layer skipped.')
        }
    }

    private createAndAddOperatorFromSource(olSource: OlVectorSource) {

        let resultType: ResultType;
        let resultSymbology: AbstractVectorSymbology;

        switch (this.selectedFeatureType) {
            case 'Point':
                resultType = ResultTypes.POINTS;
                resultSymbology = ComplexPointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            case 'Polygon':
                resultType = ResultTypes.POLYGONS;
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
            type: resultType,
        });

        const operator = new Operator({
            operatorType: sourceType,
            resultType: resultType,
            projection: Projections.WGS_84,
        });

        const layer = new VectorLayer({
            name: this.featureLayerName,
            operator: operator,
            symbology: resultSymbology,
            clustered: false,
        });

        // this.layerService.addLayer(layer);
        this.projectService.addLayer(layer);
    }

    cancelDrawing() {
        this.isDrawingActive = false;
        this.mapService.endDrawInteraction();
        this.notificationService.info('Draw features canceled.')
    }

    ngOnInit(): void {}

}
