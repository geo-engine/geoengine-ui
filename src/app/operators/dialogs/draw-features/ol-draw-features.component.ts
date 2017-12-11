import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {MapService} from '../../../map/map.service';
import * as ol from 'openlayers';
import {Projections, Projection} from '../../projection.model';
import {Operator} from '../../operator.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology,
    SimpleVectorSymbology
} from '../../../layers/symbology/symbology.model';
import {UnexpectedResultType} from '../../../util/errors';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {WKTSourceType} from '../../types/wkt-source-type.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {NotificationService} from '../../../notification.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'wave-ol-draw-features',
    templateUrl: './ol-draw-features.component.html',
    styleUrls: ['./ol-draw-features.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OlDrawFeaturesComponent implements OnInit, OnDestroy {

    featureTypes = ['Polygon', 'Point'];
    selectedFeatureType: ol.geom.GeometryType;
    isDrawingActive = false;
    olFeatureWriter = new ol.format.WKT();
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
            this.notificationService.info('Draw features canceled.')
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
        console.log("endDrawing", this.olFeatureWriter.writeFeatures(olSource.getFeatures(), {
            featureProjection: this.mapProjection.getCode(),
            dataProjection: Projections.WGS_84.getCode()
        }));
        this.createAndAddOperatorFromSource(olSource);
    }

    private createAndAddOperatorFromSource(olSource: ol.source.Vector) {

        let resultType: ResultType;
        let resultSymbology: AbstractVectorSymbology;

        switch (this.selectedFeatureType) {
            case 'Point':
                resultType = ResultTypes.POINTS;
                resultSymbology = new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                });
                break;
            case 'Polygon':
                resultType = ResultTypes.POLYGONS;
                resultSymbology = new SimpleVectorSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        const wkt = this.olFeatureWriter.writeFeatures(olSource.getFeatures(), {
            featureProjection: this.mapProjection.getCode(),
            dataProjection: Projections.WGS_84.getCode()
        });

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
